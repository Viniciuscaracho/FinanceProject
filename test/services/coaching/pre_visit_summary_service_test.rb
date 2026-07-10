# frozen_string_literal: true

require 'test_helper'

class Coaching::PreVisitSummaryServiceTest < ActiveSupport::TestCase
  setup do
    _, @account   = register_user
    @contact      = create_contact(@account)
    @account_user = @account.account_users.first
    @account_user.update!(schedule: {
      'monday'    => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'tuesday'   => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'wednesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'thursday'  => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'friday'    => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 }
    })
    @service_item = create_service(@account, selling_price_cents: 10_000)

    CoachingProfile.create!(
      account: @account, contact: @contact,
      goal: 'Perder 5kg', limitations: 'Joelho direito sensível',
      next_reassessment_at: 5.days.from_now
    )

    stub_anthropic('Bullets do resumo gerado pela IA.')
  end

  # ── retorno básico ─────────────────────────────────────────────────────────

  test 'retorna string não vazia quando API responde com sucesso' do
    result = Coaching::PreVisitSummaryService.new(@contact).call
    assert_instance_of String, result
    assert result.present?
  end

  test 'retorna mensagem de fallback quando API falha' do
    HTTParty.stubs(:post).raises(SocketError, 'connection refused')

    result = Coaching::PreVisitSummaryService.new(@contact).call
    assert_equal 'Não foi possível gerar o resumo no momento.', result
  end

  # ── conteúdo do prompt — perfil ────────────────────────────────────────────

  test 'prompt inclui nome, objetivo e limitações do atleta' do
    prompt = Coaching::PreVisitSummaryService.new(@contact).send(:prompt)

    assert_includes prompt, @contact.name
    assert_includes prompt, 'Perder 5kg'
    assert_includes prompt, 'Joelho direito sensível'
  end

  test 'prompt inclui linha de reavaliação quando data está definida' do
    prompt = Coaching::PreVisitSummaryService.new(@contact).send(:prompt)

    assert_includes prompt, 'Próxima reavaliação'
    assert_includes prompt, '5 dias'
  end

  test 'prompt não inclui linha de reavaliação quando não está agendada' do
    @contact.coaching_profile.update!(next_reassessment_at: nil)

    prompt = Coaching::PreVisitSummaryService.new(@contact).send(:prompt)
    refute_includes prompt, 'Próxima reavaliação'
  end

  # ── delta sono/carga ───────────────────────────────────────────────────────

  test 'delta_context retorna dados insuficientes sem eventos' do
    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:delta_context)
    assert_includes ctx, 'insuficientes'
  end

  test 'delta_context mostra último sono quando só há um registro' do
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'dormiu bem', sono: '8h', source: 'manual')

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:delta_context)
    assert_includes ctx, '8h'
  end

  test 'delta_context compara último sono com baseline dos anteriores' do
    # 5 eventos de baseline (mais antigos)
    5.times do |i|
      ev = TimelineEvent.create!(account: @account, contact: @contact,
                                 raw_input: 'ok', sono: '8h', carga: 'leve', source: 'manual')
      ev.update_columns(created_at: (6 + i).days.ago)
    end
    # 1 evento mais recente com variação
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'cansado', sono: '5h', carga: 'pesada', source: 'manual')

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:delta_context)
    assert_includes ctx, '5h'     # último
    assert_includes ctx, '8h'     # baseline
    assert_includes ctx, 'pesada' # carga atual
    assert_includes ctx, 'leve'   # carga baseline
  end

  # ── frequência ────────────────────────────────────────────────────────────

  test 'frequency_context retorna "Nenhuma consulta" sem agendamentos' do
    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:frequency_context)
    assert_includes ctx, 'Nenhuma consulta'
  end

  test 'frequency_context conta consultas concluídas nos últimos 30 dias' do
    make_completed_appointment(days_ago: 10, hour: 9)
    make_completed_appointment(days_ago: 20, hour: 10)
    make_completed_appointment(days_ago: 45, hour: 11) # fora da janela de 30 dias

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:frequency_context)
    assert_includes ctx, 'Últimos 30 dias: 2'
    assert_includes ctx, 'Últimos 60 dias: 3'
    assert_includes ctx, 'Total histórico: 3'
  end

  test 'frequency_context só conta consultas concluídas, não agendadas' do
    make_completed_appointment(days_ago: 10, hour: 9)
    # Cria agendamento scheduled (não concluído)
    date = next_weekday_at(5)
    @account.appointments.create!(
      account_user: @account_user, service: @service_item,
      contact: @contact, start_time: date, end_time: date + 1.hour,
      price_cents: 10_000, price_currency: 'BRL', whatsapp_number: '5541999990000',
      status: Appointment::APPOINTMENT_STATUS[:scheduled]
    )

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:frequency_context)
    assert_includes ctx, 'Últimos 30 dias: 1'
  end

  # ── alertas ───────────────────────────────────────────────────────────────

  test 'alerts_context retorna "Nenhum alerta" para atleta saudável' do
    @contact.coaching_profile.update!(last_feedback_at: 1.day.ago, next_reassessment_at: nil)

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:alerts_context)
    assert_includes ctx, 'Nenhum alerta'
  end

  test 'alerts_context inclui alerta de dor quando há evento recente com keyword' do
    @contact.coaching_profile.update!(last_feedback_at: 1.day.ago)
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'atleta com dor no joelho', source: 'manual')

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:alerts_context)
    assert_includes ctx, 'dor'
  end

  test 'alerts_context inclui alerta de sumiu quando sem feedback há 21+ dias' do
    @contact.coaching_profile.update!(last_feedback_at: 25.days.ago, next_reassessment_at: nil)

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:alerts_context)
    assert_includes ctx, 'Sumiu'
  end

  test 'alerts_context não vaza alertas de outro contato' do
    @contact.coaching_profile.update!(last_feedback_at: 1.day.ago, next_reassessment_at: nil)

    # Outro contato com alerta
    other = create_contact(@account)
    CoachingProfile.create!(account: @account, contact: other, last_feedback_at: 25.days.ago)

    ctx = Coaching::PreVisitSummaryService.new(@contact).send(:alerts_context)
    assert_includes ctx, 'Nenhum alerta'
  end

  # ── prompt completo ───────────────────────────────────────────────────────

  test 'prompt inclui todas as seções esperadas' do
    TimelineEvent.create!(account: @account, contact: @contact,
                          raw_input: 'treino forte, dormiu 6h', sono: '6h',
                          carga: 'pesada', source: 'manual')
    make_completed_appointment(days_ago: 7, hour: 9)

    prompt = Coaching::PreVisitSummaryService.new(@contact).send(:prompt)

    assert_includes prompt, 'ATLETA'
    assert_includes prompt, 'FREQUÊNCIA'
    assert_includes prompt, 'ALERTAS'
    assert_includes prompt, 'TENDÊNCIA SONO'
    assert_includes prompt, 'HISTÓRICO RECENTE'
  end

  private

  def stub_anthropic(text)
    mock_response = mock('response')
    mock_response.stubs(:parsed_response).returns({
      'content' => [{ 'text' => text }]
    })
    HTTParty.stubs(:post).returns(mock_response)
  end

  def make_completed_appointment(days_ago:, hour: 10)
    date = Date.current - days_ago.days
    date -= 1.day while date.saturday? || date.sunday?
    st = Time.zone.local(date.year, date.month, date.day, hour, 0, 0)

    @account.appointments.create!(
      account_user: @account_user, service: @service_item,
      contact: @contact, start_time: st, end_time: st + 1.hour,
      price_cents: 10_000, price_currency: 'BRL',
      whatsapp_number: '5541999990000',
      status: Appointment::APPOINTMENT_STATUS[:completed]
    )
  end

  def next_weekday_at(days_from_now)
    date = Date.current + days_from_now.days
    date += 1.day while date.saturday? || date.sunday?
    Time.zone.local(date.year, date.month, date.day, 10, 0, 0)
  end
end
