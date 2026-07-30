# frozen_string_literal: true

module Coaching
  class PreVisitSummaryService
    EVENTS_LIMIT   = 10
    DELTA_BASELINE = 5   # número de eventos anteriores usados como referência de delta

    def initialize(contact)
      @contact = contact
      @account = contact.account
    end

    def call
      raw = OpenAiClient.new('PreVisitSummaryService').complete(prompt: prompt, max_tokens: 1024)
      return [] unless raw.present?

      clean = raw.gsub(/\A```(?:json)?\s*/, '').gsub(/\s*```\z/, '').strip
      data  = JSON.parse(clean)
      Array(data['items']).select { |i| i['label'].present? && i['text'].present? }
    rescue JSON::ParserError
      # IA retornou texto livre — converte em item único para compatibilidade
      [{ 'label' => 'Resumo', 'text' => raw.to_s.strip }]
    rescue => e
      Rails.logger.error "[PreVisitSummaryService] #{e.class}: #{e.message}"
      []
    end

    private

    # ── Prompt principal ──────────────────────────────────────────────────────

    def prompt
      <<~PROMPT
        Você é um assistente de coaching esportivo. Gere um resumo pré-atendimento conciso para o treinador.
        Foque nos pontos mais relevantes para a sessão de hoje. Use linguagem direta e objetiva.

        === ATLETA ===
        Nome: #{@contact.name}
        Objetivo: #{profile&.goal.presence || 'Não informado'}
        Limitações: #{profile&.limitations.presence || 'Nenhuma'}
        #{reassessment_line}

        === FREQUÊNCIA DE CONSULTAS ===
        #{frequency_context}

        === ALERTAS ATIVOS ===
        #{alerts_context}

        === TENDÊNCIA SONO / CARGA ===
        #{delta_context}

        === HISTÓRICO RECENTE (#{recent_events.size} registros) ===
        #{events_text}

        Gere um resumo pré-atendimento com 3-5 pontos objetivos, em português.
        Retorne APENAS JSON válido, sem texto extra:
        {
          "items": [
            { "label": "categoria curta", "text": "observação objetiva para o treinador" }
          ]
        }

        Exemplos de label: "Dor/Lesão", "Sono", "Carga", "Nutrição", "Objetivo", "Frequência", "Alerta", "Reavaliação".
        Máximo 5 itens. Cada texto em 1-2 frases diretas.
      PROMPT
    end

    # ── Perfil ────────────────────────────────────────────────────────────────

    def profile
      @profile ||= @contact.coaching_profile
    end

    def reassessment_line
      return '' unless profile&.next_reassessment_at
      days = ((profile.next_reassessment_at - Time.current) / 1.day).ceil
      label = days <= 0 ? 'hoje' : "em #{days} dia#{days == 1 ? '' : 's'}"
      "Próxima reavaliação: #{label} (#{profile.next_reassessment_at.strftime('%d/%m/%Y')})"
    end

    # ── Frequência ────────────────────────────────────────────────────────────

    def frequency_context
      completed = Appointment::APPOINTMENT_STATUS[:completed]

      last_30 = Appointment
        .where(account: @account, contact: @contact, status: completed)
        .where('start_time >= ?', 30.days.ago)
        .count

      last_60 = Appointment
        .where(account: @account, contact: @contact, status: completed)
        .where('start_time >= ?', 60.days.ago)
        .count

      total = Appointment
        .where(account: @account, contact: @contact, status: completed)
        .count

      return 'Nenhuma consulta registrada.' if total.zero?

      "Últimos 30 dias: #{last_30} consulta#{last_30 == 1 ? '' : 's'} | " \
      "Últimos 60 dias: #{last_60} consulta#{last_60 == 1 ? '' : 's'} | " \
      "Total histórico: #{total}"
    end

    # ── Alertas ───────────────────────────────────────────────────────────────

    def alerts_context
      alerts = DetectorService.new(@account, contact_id: @contact.id).call
      return 'Nenhum alerta ativo.' if alerts.empty?

      alerts.map { |a| alert_line(a) }.join("\n")
    end

    def alert_line(alert)
      case alert[:alert_type]
      when 'sumiu'           then "⚠️  Sumiu: sem registro há #{alert[:days_since]} dias"
      when 'sem_feedback'    then "🔔  Sem feedback: #{alert[:days_since] ? "há #{alert[:days_since]} dias" : 'nunca registrado'}"
      when 'reclamou_de_dor' then "🚨  Reclamou de dor/lesão há #{alert[:days_since]} dia#{alert[:days_since] == 1 ? '' : 's'}"
      when 'perdeu_frequencia' then "📉  Perdeu frequência: última consulta há #{alert[:days_since]} dias"
      when 'reavaliacao_proxima' then "📅  Reavaliação próxima: em #{alert[:days_until]} dia#{alert[:days_until] == 1 ? '' : 's'}"
      else "ℹ️  #{alert[:alert_type]}"
      end
    end

    # ── Delta sono / carga ────────────────────────────────────────────────────

    def delta_context
      all_events = TimelineEvent
        .for_contact(@contact.id)
        .where(account: @account)
        .recent
        .limit(EVENTS_LIMIT)
        .to_a

      last    = all_events.first
      baseline = all_events[1, DELTA_BASELINE] || []

      return 'Dados insuficientes para análise de tendência.' if last.nil?

      lines = []

      # Sono
      if last.sono.present?
        baseline_sonos = baseline.map(&:sono).compact
        if baseline_sonos.any?
          lines << "Sono — último: #{last.sono} | referência (#{baseline_sonos.size} anteriores): #{baseline_sonos.join(', ')}"
        else
          lines << "Sono — último: #{last.sono}"
        end
      end

      # Carga
      if last.carga.present?
        baseline_cargas = baseline.map(&:carga).compact
        if baseline_cargas.any?
          lines << "Carga — último: #{last.carga} | referência (#{baseline_cargas.size} anteriores): #{baseline_cargas.join(', ')}"
        else
          lines << "Carga — último: #{last.carga}"
        end
      end

      lines.any? ? lines.join("\n") : 'Sono e carga não registrados.'
    end

    # ── Histórico recente ─────────────────────────────────────────────────────

    def recent_events
      @recent_events ||= TimelineEvent
        .for_contact(@contact.id)
        .where(account: @account)
        .recent
        .limit(EVENTS_LIMIT)
        .to_a
    end

    def events_text
      return 'Nenhum registro encontrado.' if recent_events.empty?

      recent_events.map do |e|
        parts = ["[#{e.created_at.strftime('%d/%m/%Y')}]"]
        parts << "Sono: #{e.sono}"          if e.sono.present?
        parts << "Carga: #{e.carga}"        if e.carga.present?
        parts << "Obs: #{e.observacao}"     if e.observacao.present?
        parts << "→ #{e.proxima_acao}"      if e.proxima_acao.present?
        parts.join(' | ')
      end.join("\n")
    end
  end
end
