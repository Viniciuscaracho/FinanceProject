# frozen_string_literal: true

module Coaching
  class ContextAnalysisService
    LOOKBACK_MONTHS = 6
    MAX_EVENTS      = 40

    def initialize(account, contact, triggering_event)
      @account          = account
      @contact          = contact
      @triggering_event = triggering_event
    end

    def call
      events = history_events
      return [] if events.size < 3

      response = OpenAiClient.new('ContextAnalysisService').complete(
        prompt:     build_prompt(events),
        max_tokens: 500,
      )
      return [] if response.nil?

      parse_and_save(response)
    rescue => e
      Rails.logger.error "[Coaching::ContextAnalysisService] #{e.class}: #{e.message}"
      []
    end

    private

    def active_meal_plan_summary
      plan = MealPlan
        .where(account: @account, contact: @contact, is_template: false)
        .where(status: MealPlan::STATUSES[:active])
        .order(updated_at: :desc)
        .first
      return nil unless plan

      parts = ["Plano alimentar ativo: #{plan.title}"]
      parts << "#{plan.target_kcal.to_i}kcal" if plan.target_kcal.to_f > 0

      macros = []
      macros << "P:#{plan.target_protein_g.to_i}g" if plan.target_protein_g.to_f > 0
      macros << "C:#{plan.target_carbs_g.to_i}g"   if plan.target_carbs_g.to_f > 0
      macros << "G:#{plan.target_fat_g.to_i}g"     if plan.target_fat_g.to_f > 0
      parts << "(#{macros.join(' / ')})" if macros.any?

      parts.join(' — ')
    end

    def history_events
      TimelineEvent
        .where(account: @account, contact: @contact)
        .where(created_at: LOOKBACK_MONTHS.months.ago..)
        .order(created_at: :asc)
        .limit(MAX_EVENTS)
    end

    def build_prompt(events)
      trigger_text = [@triggering_event.observacao, @triggering_event.raw_input]
                     .compact.first.to_s.truncate(200)
      trigger_date = @triggering_event.created_at.strftime('%d %b %Y')

      history_lines = events.map do |e|
        date  = e.created_at.strftime('%d %b %Y')
        parts = []
        parts << e.observacao.presence
        parts << "sono: #{e.sono}" if e.sono.present?
        parts << "carga: #{e.carga}" if e.carga.present?
        parts << e.raw_input.to_s.truncate(120) if parts.empty?
        "#{date}: #{parts.compact.join(' | ')}"
      end.join("\n")

      meal_plan_line = active_meal_plan_summary

      <<~PROMPT
        Você é um assistente especializado em análise de histórico de atletas.

        Analise o histórico abaixo e identifique APENAS padrões realmente significativos: recorrências, tendências claras, ou conexões entre eventos separados no tempo que um treinador não perceberia sem ajuda.

        Seja CONSERVADOR. Retorne insights vazio se não houver padrão relevante. Não invente padrões.

        Atleta: #{@contact.name}
        #{meal_plan_line ? "#{meal_plan_line}\n" : ""}Evento atual (#{trigger_date}): #{trigger_text}

        Histórico (#{events.size} eventos, últimos #{LOOKBACK_MONTHS} meses):
        #{history_lines}

        Retorne APENAS JSON válido, sem texto extra:
        {
          "insights": [
            {
              "type": "recurrence|regression|improvement|absence_pattern",
              "text": "frase objetiva em português com datas específicas mencionadas",
              "severity": "high|medium|low",
              "related_dates": ["YYYY-MM-DD"]
            }
          ]
        }

        Tipos: recurrence = algo negativo que já ocorreu antes (dor, lesão, queda de aderência). regression = piora mensurável ao longo do tempo. improvement = melhora clara e consistente. absence_pattern = padrão de sumiço que se repete.
        Máximo 2 insights. Uma frase cada, em português, específica e com datas.
      PROMPT
    end

    def parse_and_save(response)
      clean = response.gsub(/\A```(?:json)?\s*/, '').gsub(/\s*```\z/, '').strip
      data  = JSON.parse(clean)
      raw   = Array(data['insights'])
      return [] if raw.empty?

      raw.filter_map do |ins|
        next unless ins['text'].present? && CoachingInsight::TYPES.include?(ins['type'])

        CoachingInsight.create!(
          account:       @account,
          contact:       @contact,
          insight_type:  ins['type'],
          insight_text:  ins['text'].truncate(400),
          severity:      CoachingInsight::SEVERITIES.include?(ins['severity']) ? ins['severity'] : 'medium',
          related_dates: Array(ins['related_dates']).first(5),
          expires_at:    7.days.from_now,
        )
      end
    rescue JSON::ParserError => e
      Rails.logger.error "[Coaching::ContextAnalysisService] JSON parse error: #{e.message}"
      []
    end
  end
end
