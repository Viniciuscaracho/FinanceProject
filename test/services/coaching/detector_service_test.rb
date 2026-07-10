# frozen_string_literal: true

require 'test_helper'

class Coaching::DetectorServiceTest < ActiveSupport::TestCase
  setup do
    _, @account   = register_user
    @contact      = create_contact(@account)
    @account_user = @account.account_users.first
    @account_user.update!(schedule: {
      'monday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'tuesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'wednesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'thursday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'friday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 }
    })
    @service = create_service(@account, selling_price_cents: 10_000)
  end

  # ─────────────────────────────────────────────────────────────────────────
  # Base
  # ─────────────────────────────────────────────────────────────────────────

  test 'retorna array vazio sem perfis' do
    assert_empty Coaching::DetectorService.new(@account).call
  end

  test 'não retorna alertas de outro account' do
    _, other = register_user
    other_contact = create_contact(other)
    CoachingProfile.create!(account: other, contact: other_contact, last_feedback_at: nil)

    assert_empty Coaching::DetectorService.new(@account).call
  end

  # ─────────────────────────────────────────────────────────────────────────
  # sem_feedback (7-20 dias ou NULL)
  # ─────────────────────────────────────────────────────────────────────────

  test 'sem_feedback: detecta quando last_feedback_at é nil' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: nil)

    alerts = select_alerts('sem_feedback')
    assert_equal 1, alerts.size
    assert_equal @contact.id,   alerts.first[:contact_id]
    assert_equal @contact.name, alerts.first[:contact_name]
    assert_nil alerts.first[:days_since]
  end

  test 'sem_feedback: detecta com 10 dias sem registro' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 10.days.ago)

    assert_equal 1, select_alerts('sem_feedback').size
  end

  test 'sem_feedback: não dispara com feedback recente (2 dias)' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 2.days.ago)

    assert_empty select_alerts('sem_feedback')
  end

  test 'sem_feedback: não dispara quando contato está em sumiu (21+ dias)' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 25.days.ago)

    # Deve aparecer em sumiu, NÃO em sem_feedback
    assert_empty  select_alerts('sem_feedback')
    assert_equal 1, select_alerts('sumiu').size
  end

  # ─────────────────────────────────────────────────────────────────────────
  # sumiu (21+ dias)
  # ─────────────────────────────────────────────────────────────────────────

  test 'sumiu: detecta com 25 dias sem feedback' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 25.days.ago)

    alerts = select_alerts('sumiu')
    assert_equal 1, alerts.size
    assert_equal @contact.id,   alerts.first[:contact_id]
    assert_equal @contact.name, alerts.first[:contact_name]
    assert alerts.first[:days_since] >= 25
  end

  test 'sumiu: não dispara com 10 dias (ainda é sem_feedback)' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 10.days.ago)

    assert_empty select_alerts('sumiu')
  end

  test 'sumiu: não dispara quando last_feedback_at é nil (novo contato)' do
    # NULL = nunca teve feedback = sem_feedback, não sumiu
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: nil)

    assert_empty select_alerts('sumiu')
  end

  test 'sumiu: não dispara com feedback recente' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 2.days.ago)

    assert_empty select_alerts('sumiu')
  end

  # ─────────────────────────────────────────────────────────────────────────
  # reavaliacao_proxima
  # ─────────────────────────────────────────────────────────────────────────

  test 'reavaliacao_proxima: detecta dentro de 7 dias' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at: 1.day.ago,
                            next_reassessment_at: 5.days.from_now)

    alerts = select_alerts('reavaliacao_proxima')
    assert_equal 1, alerts.size
    assert alerts.first[:days_until] >= 0
  end

  test 'reavaliacao_proxima: não dispara quando avaliação é em 30 dias' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at: 1.day.ago,
                            next_reassessment_at: 30.days.from_now)

    assert_empty select_alerts('reavaliacao_proxima')
  end

  # ─────────────────────────────────────────────────────────────────────────
  # reclamou_de_dor
  # ─────────────────────────────────────────────────────────────────────────

  test 'reclamou_de_dor: detecta keyword "dor" em raw_input recente' do
    CoachingProfile.create!(account: @account, contact: @contact)
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'sentiu dor no joelho durante o treino', source: 'manual')

    alerts = select_alerts('reclamou_de_dor')
    assert_equal 1, alerts.size
    assert_equal @contact.id, alerts.first[:contact_id]
    assert_not_nil alerts.first[:days_since]
  end

  test 'reclamou_de_dor: detecta keyword "lesão" em observacao' do
    CoachingProfile.create!(account: @account, contact: @contact)
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'treino ok', observacao: 'possível lesão no ombro',
                          source: 'manual')

    assert_equal 1, select_alerts('reclamou_de_dor').size
  end

  test 'reclamou_de_dor: detecta múltiplas keywords (machucou, tendinite)' do
    CoachingProfile.create!(account: @account, contact: @contact)
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'machucou o tornozelo, pode ser tendinite', source: 'manual')

    assert_equal 1, select_alerts('reclamou_de_dor').size
  end

  test 'reclamou_de_dor: não dispara para evento fora da janela (8 dias atrás)' do
    CoachingProfile.create!(account: @account, contact: @contact)
    old_event = TimelineEvent.create!(account: @account, contact: @contact,
                                      raw_input: 'dor no joelho', source: 'manual')
    old_event.update_columns(created_at: 8.days.ago)

    assert_empty select_alerts('reclamou_de_dor')
  end

  test 'reclamou_de_dor: não dispara sem keyword de dor' do
    CoachingProfile.create!(account: @account, contact: @contact)
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'treino excelente, atleta animado', source: 'manual')

    assert_empty select_alerts('reclamou_de_dor')
  end

  test 'reclamou_de_dor: não vaza entre accounts' do
    _, other = register_user
    other_contact = create_contact(other)
    CoachingProfile.create!(account: other, contact: other_contact)
    TimelineEvent.create!(account: other, contact: other_contact,
                          raw_input: 'muita dor hoje', source: 'manual')

    assert_empty select_alerts('reclamou_de_dor')
  end

  # ─────────────────────────────────────────────────────────────────────────
  # perdeu_frequencia
  # ─────────────────────────────────────────────────────────────────────────

  test 'perdeu_frequencia: detecta contato que parou de comparecer' do
    CoachingProfile.create!(account: @account, contact: @contact)
    # consulta antiga concluída (há 20 dias)
    create_completed_appointment(contact: @contact, days_ago: 20)

    alerts = select_alerts('perdeu_frequencia')
    assert_equal 1, alerts.size
    assert_equal @contact.id, alerts.first[:contact_id]
    assert alerts.first[:days_since] >= 20
  end

  test 'perdeu_frequencia: não dispara quando há consulta concluída recente' do
    CoachingProfile.create!(account: @account, contact: @contact)
    create_completed_appointment(contact: @contact, days_ago: 5)

    assert_empty select_alerts('perdeu_frequencia')
  end

  test 'perdeu_frequencia: não dispara para contato sem histórico de consultas' do
    # Contato com coaching profile mas NUNCA teve consulta → não deve ser flagrado
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: nil)

    assert_empty select_alerts('perdeu_frequencia')
  end

  test 'perdeu_frequencia: não vaza entre accounts' do
    _, other = register_user
    other_contact = create_contact(other)
    CoachingProfile.create!(account: other, contact: other_contact)

    assert_empty select_alerts('perdeu_frequencia')
  end

  # ─────────────────────────────────────────────────────────────────────────
  # Combinações — mesmo contato pode ter múltiplos alertas
  # ─────────────────────────────────────────────────────────────────────────

  test 'mesmo contato pode ter sem_feedback + reavaliacao_proxima simultaneamente' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at: nil,
                            next_reassessment_at: 3.days.from_now)

    types = all_alert_types
    assert_includes types, 'sem_feedback'
    assert_includes types, 'reavaliacao_proxima'
  end

  test 'mesmo contato pode ter dor + perdeu_frequencia simultaneamente' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 2.days.ago)
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'atleta com dor forte no quadril', source: 'manual')
    create_completed_appointment(contact: @contact, days_ago: 20)

    types = all_alert_types
    assert_includes types, 'reclamou_de_dor'
    assert_includes types, 'perdeu_frequencia'
  end

  test 'sumiu + reavaliacao_proxima podem coexistir' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at: 25.days.ago,
                            next_reassessment_at: 3.days.from_now)

    types = all_alert_types
    assert_includes types, 'sumiu'
    assert_includes types, 'reavaliacao_proxima'
    # sumiu absorve sem_feedback — não duplica
    assert_empty types.select { |t| t == 'sem_feedback' }
  end

  private

  def select_alerts(type)
    Coaching::DetectorService.new(@account).call.select { |a| a[:alert_type] == type }
  end

  def all_alert_types
    Coaching::DetectorService.new(@account).call.map { |a| a[:alert_type] }
  end

  def next_weekday(days_from_now = 8)
    day = Date.current + days_from_now.days
    day += 1.day while day.saturday? || day.sunday?
    day
  end

  def create_completed_appointment(contact:, days_ago:)
    # Garante dia útil + horário dentro da janela de trabalho (8-18h)
    date = Date.current - days_ago.days
    date -= 1.day while date.saturday? || date.sunday?
    start_time = Time.zone.local(date.year, date.month, date.day, 10, 0, 0)

    @account.appointments.create!(
      account_user:    @account_user,
      service:         @service,
      contact:         contact,
      start_time:      start_time,
      end_time:        start_time + 1.hour,
      price_cents:     10_000,
      price_currency:  'BRL',
      whatsapp_number: contact.cell_phone_number.presence || '5541999990000',
      status:          Appointment::APPOINTMENT_STATUS[:completed]
    )
  end
end
