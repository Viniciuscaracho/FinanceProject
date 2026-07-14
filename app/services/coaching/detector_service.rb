# frozen_string_literal: true

module Coaching
  class DetectorService
    # ── Thresholds ──────────────────────────────────────────────────────────
    SEM_FEEDBACK_DIAS  = 7   # warning: sem registro em 7-20 dias
    SUMIU_DIAS         = 21  # crítico: desapareceu há 21+ dias
    REAVALIACAO_DIAS   = 7   # reavaliação dentro de 7 dias
    DOR_JANELA_DIAS    = 7   # menção de dor nos últimos 7 dias
    FREQUENCIA_DIAS    = 14  # sem consulta concluída há 14+ dias

    # Palavras-chave de dor/lesão detectadas em raw_input e observacao
    PAIN_KEYWORDS = %w[
      dor lesão lesao machucou machucada machucado
      inflamação inflamacao tendinite torção torcao
      bursite distensão distensao lombalgia cervicalgia
    ].freeze

    def initialize(account, contact_id: nil)
      @account    = account
      @contact_id = contact_id
    end

    def call
      alerts = [
        *alerts_sumiu,
        *alerts_sem_feedback,
        *alerts_reavaliacao,
        *alerts_dor,
        *alerts_frequencia
      ]
      @contact_id ? alerts.select { |a| a[:contact_id] == @contact_id } : alerts
    end

    private

    # ── 1. Sumiu (21+ dias sem registro — mais grave que sem_feedback) ──────

    def alerts_sumiu
      profiles_sumiu.map do |profile|
        build_alert(profile, 'sumiu',
                    days_since: days_since(profile.last_feedback_at))
      end
    end

    def profiles_sumiu
      CoachingProfile
        .where(account: @account)
        .where('last_feedback_at < ?', SUMIU_DIAS.days.ago)
        .includes(:contact)
    end

    # ── 2. Sem feedback (7-20 dias, ou NULL) ────────────────────────────────
    # Não sobrepõe com sumiu: contatos com 21+ dias já aparecem em `sumiu`.

    def alerts_sem_feedback
      profiles_sem_feedback.map do |profile|
        build_alert(profile, 'sem_feedback',
                    days_since: days_since(profile.last_feedback_at))
      end
    end

    def profiles_sem_feedback
      CoachingProfile
        .where(account: @account)
        .where(
          '(last_feedback_at >= ? AND last_feedback_at < ?) OR last_feedback_at IS NULL',
          SUMIU_DIAS.days.ago,
          SEM_FEEDBACK_DIAS.days.ago
        )
        .includes(:contact)
    end

    # ── 3. Reavaliação próxima (dentro de 7 dias) ────────────────────────────

    def alerts_reavaliacao
      profiles_reavaliacao.map do |profile|
        build_alert(profile, 'reavaliacao_proxima',
                    days_until: days_until(profile.next_reassessment_at))
      end
    end

    def profiles_reavaliacao
      CoachingProfile
        .where(account: @account)
        .where(next_reassessment_at: Time.current..REAVALIACAO_DIAS.days.from_now)
        .includes(:contact)
    end

    # ── 4. Reclamou de dor (keywords nos últimos 7 dias) ────────────────────

    def alerts_dor
      profiles_dor.map do |profile|
        build_alert(profile, 'reclamou_de_dor',
                    days_since: days_since_last_dor(profile.contact_id))
      end
    end

    def profiles_dor
      contact_ids = TimelineEvent
        .where(account: @account)
        .where('created_at >= ?', DOR_JANELA_DIAS.days.ago)
        .where(pain_where_clause, *pain_where_values)
        .distinct
        .pluck(:contact_id)

      return CoachingProfile.none if contact_ids.empty?

      CoachingProfile
        .where(account: @account)
        .where(contact_id: contact_ids)
        .includes(:contact)
    end

    def days_since_last_dor(contact_id)
      last_event = TimelineEvent
        .where(account: @account, contact_id: contact_id)
        .where(pain_where_clause, *pain_where_values)
        .order(created_at: :desc)
        .first
      days_since(last_event&.created_at)
    end

    # ── 5. Perdeu frequência (teve consulta, mas nenhuma em 14+ dias) ────────

    def alerts_frequencia
      profiles_frequencia.map do |profile|
        build_alert(profile, 'perdeu_frequencia',
                    days_since: days_since_last_visit(profile.contact_id))
      end
    end

    def profiles_frequencia
      completed = Appointment::APPOINTMENT_STATUS[:completed]

      # Contatos que JÁ tiveram pelo menos uma consulta concluída (evita falso positivo)
      ever_active_ids = Appointment
        .where(account: @account)
        .where(status: completed)
        .distinct
        .pluck(:contact_id)
        .compact

      return CoachingProfile.none if ever_active_ids.empty?

      # Desses, quais NÃO tiveram consulta concluída recentemente
      recently_active_ids = Appointment
        .where(account: @account)
        .where(status: completed)
        .where('start_time >= ?', FREQUENCIA_DIAS.days.ago)
        .distinct
        .pluck(:contact_id)
        .compact

      lost_ids = ever_active_ids - recently_active_ids
      return CoachingProfile.none if lost_ids.empty?

      CoachingProfile
        .where(account: @account)
        .where(contact_id: lost_ids)
        .includes(:contact)
    end

    def days_since_last_visit(contact_id)
      last = Appointment
        .where(account: @account, contact_id: contact_id)
        .where(status: Appointment::APPOINTMENT_STATUS[:completed])
        .order(start_time: :desc)
        .first
      days_since(last&.start_time)
    end

    # ── Helpers ──────────────────────────────────────────────────────────────

    def build_alert(profile, type, **extra)
      { contact_id: profile.contact_id, contact_name: profile.contact.name, alert_type: type }.merge(extra)
    end

    def days_since(datetime)
      return nil if datetime.nil?
      ((Time.current - datetime) / 1.day).ceil
    end

    def days_until(datetime)
      return nil if datetime.nil?
      ((datetime - Time.current) / 1.day).ceil
    end

    def pain_where_clause
      PAIN_KEYWORDS.flat_map { ['raw_input ILIKE ?', 'observacao ILIKE ?'] }.join(' OR ')
    end

    def pain_where_values
      PAIN_KEYWORDS.flat_map { |k| ["%#{k}%", "%#{k}%"] }
    end
  end
end
