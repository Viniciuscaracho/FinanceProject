# frozen_string_literal: true

require 'test_helper'

# Base de testes MVP — conta viniciuscaracho77@gmail.com
#
# Cobre os principais fluxos do produto em ordem de jornada:
#   1. Autenticação
#   2. Gestão financeira (contas, categorias, transações, dashboard)
#   3. Clientes / Contatos
#   4. Agendamentos
#   5. Camada de Coaching IA
class MvpScenariosTest < ActionDispatch::IntegrationTest
  MVP_EMAIL    = 'viniciuscaracho77@gmail.com'
  MVP_PASSWORD = 'password'

  setup do
    @user, @account = register_user(
      email:                 MVP_EMAIL,
      password:              MVP_PASSWORD,
      password_confirmation: MVP_PASSWORD,
      first_name:            'Vinicius',
      last_name:             'Caracho',
      company_name:          'Orbi — Treinador Teste'
    )
    @auth_token = generate_auth_token(@user)
    @headers    = { 'Authorization' => "Bearer #{@auth_token}", 'Accept' => 'application/json' }

    Coaching::StructureNoteService.any_instance.stubs(:call).returns(
      { sono: '7h', carga: 'moderada', observacao: 'atleta bem disposto', proxima_acao: 'aumentar carga' }
    )
    Coaching::FeedbackDraftService.any_instance.stubs(:call).returns('Ótimo trabalho esta semana!')
    Coaching::PreVisitSummaryService.any_instance.stubs(:call).returns('Atleta em evolução positiva.')
  end

  # ─────────────────────────────────────────────────────────────────────
  # 1. AUTENTICAÇÃO
  # ─────────────────────────────────────────────────────────────────────

  test 'GET /api/v1/auth/me retorna o usuário autenticado' do
    get api_v1_auth_me_url(format: :json), headers: @headers
    assert_response :success
    assert_equal MVP_EMAIL, response.parsed_body['user']['email']
  end

  test 'GET /api/v1/auth/me rejeita token inválido' do
    get api_v1_auth_me_url(format: :json), headers: { 'Authorization' => 'Bearer token_invalido' }
    assert_response :unauthorized
  end

  # ─────────────────────────────────────────────────────────────────────
  # 2. GESTÃO FINANCEIRA
  # ─────────────────────────────────────────────────────────────────────

  # --- Contas bancárias ---

  test 'cria conta bancária principal' do
    assert_difference('BankAccount.count') do
      post api_v1_bank_accounts_url(format: :json),
           params: { bank_account: { name: 'Nubank Principal', account_type: 'current_account',
                                     initial_balance_cents: 500_000, default: true } },
           headers: @headers
    end
    assert_response :created
  end

  test 'lista contas bancárias' do
    create_bank_account(@account, name: 'Conta Teste')
    get api_v1_bank_accounts_url(format: :json), headers: @headers
    assert_response :success
    names = response.parsed_body['bank_accounts'].map { |b| b['name'] }
    assert_includes names, 'Conta Teste'
  end

  test 'endpoint de saldo existe e requer autenticação' do
    get '/api/v1/bank_accounts/balance', headers: { 'Authorization' => 'Bearer invalido' }
    assert_response :unauthorized
  end

  # --- Categorias ---

  test 'cria categoria de receita' do
    assert_difference('Category.count') do
      post api_v1_categories_url(format: :json),
           params: { category: { name: 'Mensalidades', transaction_type: 'revenue' } },
           headers: @headers
    end
    assert_response :created
    assert_equal 'Mensalidades', response.parsed_body['category']['name']
  end

  test 'cria categoria de despesa' do
    assert_difference('Category.count') do
      post api_v1_categories_url(format: :json),
           params: { category: { name: 'Aluguel', transaction_type: 'fixed_expense' } },
           headers: @headers
    end
    assert_response :created
    assert_equal 'Aluguel', response.parsed_body['category']['name']
  end

  test 'lista categorias do account' do
    create_category(@account, name: 'Marketing')
    get api_v1_categories_url(format: :json), headers: @headers
    assert_response :success
    names = response.parsed_body['categories'].map { |c| c['name'] }
    assert_includes names, 'Marketing'
  end

  test 'exibe detalhe da categoria' do
    cat = create_category(@account, name: 'Serviços')
    get api_v1_category_url(cat, format: :json), headers: @headers
    assert_response :success
    assert_equal 'Serviços', response.parsed_body['category']['name']
  end

  test 'atualiza categoria' do
    cat = create_category(@account, name: 'Antes')
    patch api_v1_category_url(cat, format: :json),
          params: { category: { name: 'Depois' } },
          headers: @headers
    assert_response :success
    assert_equal 'Depois', response.parsed_body['category']['name']
  end

  test 'remove categoria' do
    cat = create_category(@account)
    assert_difference('Category.count', -1) do
      delete api_v1_category_url(cat, format: :json), headers: @headers
    end
    assert_response :success
  end

  # --- Transações ---

  test 'cria transação de receita' do
    bank = create_bank_account(@account)
    assert_difference('Transaction.count') do
      post api_v1_transactions_url(format: :json),
           params: {
             transaction: {
               name:             'Mensalidade João',
               transaction_type: 'revenue',
               amount_cents:     30_000,
               amount_currency:  'BRL',
               due_date:         Date.current.iso8601,
               bank_account_id:  bank.id,
               paid:             true
             }
           },
           headers: @headers
    end
    assert_response :created
    assert_equal 30_000, response.parsed_body['amount_cents']
  end

  test 'cria transação de despesa fixa' do
    bank = create_bank_account(@account)
    assert_difference('Transaction.count') do
      post api_v1_transactions_url(format: :json),
           params: {
             transaction: {
               name:             'Aluguel sala',
               transaction_type: 'fixed_expense',
               amount_cents:     200_000,
               amount_currency:  'BRL',
               due_date:         Date.current.iso8601,
               bank_account_id:  bank.id,
               paid:             false
             }
           },
           headers: @headers
    end
    assert_response :created
  end

  test 'lista transações do período atual' do
    bank = create_bank_account(@account)
    create_transaction(@account, bank, name: 'Receita A', due_date: Date.current)
    create_transaction(@account, bank, name: 'Receita B', due_date: Date.current)
    get api_v1_transactions_url(format: :json), headers: @headers
    assert_response :success
    names = response.parsed_body['transactions'].map { |t| t['name'] }
    assert_includes names, 'Receita A'
    assert_includes names, 'Receita B'
  end

  test 'filtra transações por tipo' do
    bank = create_bank_account(@account)
    create_transaction(@account, bank, transaction_type: :revenue,       name: 'Rec 1')
    create_transaction(@account, bank, transaction_type: :fixed_expense, name: 'Desp 1')
    get api_v1_transactions_url(format: :json),
        params: { transaction_type: 'revenue' },
        headers: @headers
    assert_response :success
    txs = response.parsed_body['transactions']
    assert txs.any?
    assert txs.all? { |t| t['transaction_type_cd'] == Transaction.transaction_types[:revenue] }
  end

  test 'exibe detalhe de transação' do
    bank = create_bank_account(@account)
    tx   = create_transaction(@account, bank, name: 'Detalhe')
    get api_v1_transaction_url(tx, format: :json), headers: @headers
    assert_response :success
    assert_equal 'Detalhe', response.parsed_body['name']
  end

  test 'atualiza transação existente' do
    bank = create_bank_account(@account)
    tx   = create_transaction(@account, bank, name: 'Original')
    patch api_v1_transaction_url(tx, format: :json),
          params: { transaction: { name: 'Atualizado', paid: true } },
          headers: @headers
    assert_response :success
    assert_equal 'Atualizado', response.parsed_body['name']
    assert response.parsed_body['paid']
  end

  test 'remove transação' do
    bank = create_bank_account(@account)
    tx   = create_transaction(@account, bank)
    assert_difference('Transaction.count', -1) do
      delete api_v1_transaction_url(tx, format: :json), headers: @headers
    end
    assert_response :success
  end

  test 'bulk_mark_as_paid marca múltiplas transações como pagas' do
    bank = create_bank_account(@account)
    t1 = create_transaction(@account, bank, paid: false)
    t2 = create_transaction(@account, bank, paid: false)
    post bulk_mark_as_paid_api_v1_transactions_url(format: :json),
         params: { transaction_ids: [t1.id, t2.id] },
         headers: @headers
    assert_response :no_content
    assert t1.reload.paid?
    assert t2.reload.paid?
  end

  test 'não acessa transação de outro account' do
    _, other_account = register_user
    other_bank = create_bank_account(other_account)
    other_tx   = create_transaction(other_account, other_bank)
    get api_v1_transaction_url(other_tx, format: :json), headers: @headers
    assert_includes [404, 500], response.status
  end

  # --- Dashboard ---

  test 'GET /api/v1/dashboard retorna resumo financeiro' do
    get api_v1_dashboard_url(format: :json), headers: @headers
    assert_response :success
  end

  test 'GET /api/v1/dashboard/statistics retorna estatísticas' do
    get api_v1_dashboard_statistics_url(format: :json), headers: @headers
    assert_response :success
  end

  test 'GET /api/v1/dashboard/overdue_commitments lista compromissos vencidos' do
    get api_v1_dashboard_overdue_commitments_url(format: :json), headers: @headers
    assert_response :success
  end

  test 'GET /api/v1/dashboard/today_commitments lista compromissos de hoje' do
    get api_v1_dashboard_today_commitments_url(format: :json), headers: @headers
    assert_response :success
  end

  # ─────────────────────────────────────────────────────────────────────
  # 3. CLIENTES / CONTATOS
  # ─────────────────────────────────────────────────────────────────────

  test 'cria contato (atleta)' do
    assert_difference('Contact.count') do
      post api_v1_contacts_url(format: :json),
           params: {
             contact: {
               name:              'João Atleta',
               contact_type:      'client',
               person_type:       'natural',
               email:             'joao@exemplo.com',
               cell_phone_number: '44999991234'
             }
           },
           headers: @headers
    end
    assert_response :created
    assert_equal 'João Atleta', response.parsed_body['contact']['name']
  end

  test 'lista contatos do account' do
    create_contact(@account, name: 'Ana Corredora')
    get api_v1_contacts_url(format: :json), headers: @headers
    assert_response :success
    names = response.parsed_body['contacts'].map { |c| c['name'] }
    assert_includes names, 'Ana Corredora'
  end

  test 'exibe detalhe do contato' do
    contact = create_contact(@account, name: 'Pedro Triatleta')
    get api_v1_contact_url(contact, format: :json), headers: @headers
    assert_response :success
    assert_equal 'Pedro Triatleta', response.parsed_body['contact']['name']
  end

  test 'atualiza contato' do
    contact = create_contact(@account)
    patch api_v1_contact_url(contact, format: :json),
          params: { contact: { email: 'atualizado@exemplo.com', description: 'Atleta de alto rendimento' } },
          headers: @headers
    assert_response :success
    assert_equal 'atualizado@exemplo.com', response.parsed_body['contact']['email']
  end

  test 'remove contato' do
    contact = create_contact(@account)
    assert_difference('Contact.count', -1) do
      delete api_v1_contact_url(contact, format: :json), headers: @headers
    end
    assert_response :success
  end

  test 'não acessa contato de outro account' do
    _, other = register_user
    other_contact = create_contact(other)
    get api_v1_contact_url(other_contact, format: :json), headers: @headers
    assert_includes [404, 500], response.status
  end

  # ─────────────────────────────────────────────────────────────────────
  # 4. AGENDAMENTOS
  # ─────────────────────────────────────────────────────────────────────

  setup do
    @account_user = @account.account_users.first
    @account_user.update!(
      schedule: {
        'monday'    => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
        'tuesday'   => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
        'wednesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
        'thursday'  => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
        'friday'    => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 }
      }
    )
    @service = create_service(@account, name: 'Consulta Personal', selling_price_cents: 15_000)
    @athlete = create_contact(@account, name: 'Atleta Teste')
  end

  test 'lista agendamentos do account' do
    start_time = next_weekday_at(10)
    @account.appointments.create!(
      account_user:    @account_user,
      service:         @service,
      contact:         @athlete,
      start_time:      start_time,
      end_time:        start_time + 1.hour,
      price_cents:     15_000,
      price_currency:  'BRL',
      whatsapp_number: '5541999990000',
      status:          :confirmed
    )
    get api_v1_appointments_path, headers: @headers
    assert_response :success
    assert response.parsed_body.is_a?(Array)
    assert response.parsed_body.any? { |a| a['client']&.dig('id') == @athlete.id }
  end

  test 'cria agendamento' do
    start_time = next_weekday_at(14)
    assert_difference('Appointment.count') do
      post api_v1_appointments_path,
           params: {
             appointment: {
               account_user_id: @account_user.id,
               service_id:      @service.id,
               contact_id:      @athlete.id,
               start_time:      start_time.iso8601,
               end_time:        (start_time + 1.hour).iso8601,
               price_cents:     15_000,
               price_currency:  'BRL',
               whatsapp_number: '5541999990001',
               status:          'pending'
             }
           },
           headers: @headers
    end
    assert_response :created
  end

  test 'confirma agendamento' do
    appt = create_appointment(status: :pending)
    patch api_v1_appointment_path(appt),
          params: { appointment: { status: 'confirmed' } },
          headers: @headers
    assert_response :success
    assert_equal 'confirmed', response.parsed_body['status']
  end

  test 'cancela agendamento' do
    appt = create_appointment(status: :confirmed)
    patch api_v1_appointment_path(appt),
          params: { appointment: { status: 'canceled' } },
          headers: @headers
    assert_response :success
    assert_equal 'canceled', response.parsed_body['status']
  end

  test 'conclui agendamento' do
    appt = create_appointment(status: :confirmed)
    patch api_v1_appointment_path(appt),
          params: { appointment: { status: 'completed' } },
          headers: @headers
    assert_response :success
    assert_equal 'completed', response.parsed_body['status']
  end

  test 'cancela agendamento via destroy (não exclui, cancela)' do
    appt = create_appointment(status: :pending)
    assert_no_difference('Appointment.count') do
      delete api_v1_appointment_path(appt), headers: @headers
    end
    assert_response :success
    assert_equal 'canceled', response.parsed_body['status']
  end

  test 'não acessa agendamento de outro account' do
    _, other       = register_user
    other_user     = other.account_users.first
    other_service  = create_service(other)
    other_contact  = create_contact(other)
    other_user.update!(schedule: {
      'monday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'tuesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'wednesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'thursday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 },
      'friday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 18 }
    })
    start_time = next_weekday_at(10)
    other_appt = other.appointments.create!(
      account_user:    other_user,
      service:         other_service,
      contact:         other_contact,
      start_time:      start_time,
      end_time:        start_time + 1.hour,
      price_cents:     10_000,
      price_currency:  'BRL',
      whatsapp_number: '5541999990099',
      status:          :pending
    )
    get api_v1_appointment_path(other_appt), headers: @headers
    assert_includes [404, 500], response.status
  end

  # ─────────────────────────────────────────────────────────────────────
  # 5. COACHING IA
  # ─────────────────────────────────────────────────────────────────────

  test 'lista alertas vazia sem perfis de coaching' do
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    assert_response :success
    assert_equal [], response.parsed_body['alerts']
  end

  test 'alerta sem_feedback quando nunca houve feedback' do
    CoachingProfile.create!(account: @account, contact: @athlete, last_feedback_at: nil)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    alerts = response.parsed_body['alerts']
    assert_equal 1, alerts.size
    assert_equal 'sem_feedback', alerts.first['alert_type']
    assert_equal @athlete.id,    alerts.first['contact_id']
    assert_equal @athlete.name,  alerts.first['contact_name']
  end

  test 'alerta sem_feedback quando feedback tem mais de 7 dias' do
    CoachingProfile.create!(account: @account, contact: @athlete, last_feedback_at: 10.days.ago)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    alerts = response.parsed_body['alerts'].select { |a| a['alert_type'] == 'sem_feedback' }
    assert_equal 1, alerts.size
  end

  test 'nenhum alerta sem_feedback quando feedback é recente' do
    CoachingProfile.create!(account: @account, contact: @athlete, last_feedback_at: 2.days.ago)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    sem_fb = response.parsed_body['alerts'].select { |a| a['alert_type'] == 'sem_feedback' }
    assert_empty sem_fb
  end

  test 'alerta reavaliacao_proxima dentro de 7 dias' do
    CoachingProfile.create!(account: @account, contact: @athlete,
                            last_feedback_at: 1.day.ago, next_reassessment_at: 3.days.from_now)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    reavaliacao = response.parsed_body['alerts'].select { |a| a['alert_type'] == 'reavaliacao_proxima' }
    assert_equal 1, reavaliacao.size
  end

  test 'sem alerta reavaliacao quando avaliação é em mais de 7 dias' do
    CoachingProfile.create!(account: @account, contact: @athlete,
                            last_feedback_at: 1.day.ago, next_reassessment_at: 30.days.from_now)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    reavaliacao = response.parsed_body['alerts'].select { |a| a['alert_type'] == 'reavaliacao_proxima' }
    assert_empty reavaliacao
  end

  test 'atleta pode ter dois alertas simultâneos' do
    CoachingProfile.create!(account: @account, contact: @athlete,
                            last_feedback_at: nil, next_reassessment_at: 3.days.from_now)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    types = response.parsed_body['alerts'].map { |a| a['alert_type'] }
    assert_includes types, 'sem_feedback'
    assert_includes types, 'reavaliacao_proxima'
  end

  test 'alertas não vazam entre accounts' do
    _, other = register_user
    other_contact = create_contact(other)
    CoachingProfile.create!(account: other, contact: other_contact, last_feedback_at: nil)
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    assert_equal [], response.parsed_body['alerts']
  end

  test 'requer autenticação para listar alertas' do
    get api_v1_coaching_alerts_url(format: :json)
    assert_response :unauthorized
  end

  # --- Perfil de coaching ---

  test 'exibe coaching_profile do atleta' do
    CoachingProfile.create!(account: @account, contact: @athlete)
    get api_v1_coaching_contact_coaching_profile_url(@athlete, format: :json), headers: @headers
    assert_response :success
    assert response.parsed_body['profile'].key?('id')
  end

  test 'atualiza coaching_profile com next_reassessment_at' do
    CoachingProfile.create!(account: @account, contact: @athlete)
    patch api_v1_coaching_contact_coaching_profile_url(@athlete, format: :json),
          params: { next_reassessment_at: 14.days.from_now.iso8601, goal: 'Perder 5kg' },
          headers: @headers
    assert_response :success
    assert_equal 'Perder 5kg', response.parsed_body['profile']['goal']
  end

  # --- Timeline (notas de treino estruturadas por IA) ---

  test 'lista events vazia para atleta sem notas' do
    get api_v1_coaching_contact_timeline_events_url(@athlete, format: :json), headers: @headers
    assert_response :success
    assert_equal [], response.parsed_body['events']
  end

  test 'cria timeline event e retorna campos estruturados pela IA' do
    assert_difference('TimelineEvent.count') do
      post api_v1_coaching_contact_timeline_events_url(@athlete, format: :json),
           params: { raw_input: 'dormiu bem, treino moderado, sem dores' },
           headers: @headers
    end
    assert_response :created
    body = response.parsed_body['event']
    assert_equal '7h',                  body['sono']
    assert_equal 'moderada',            body['carga']
    assert_equal 'atleta bem disposto', body['observacao']
    assert_equal 'aumentar carga',      body['proxima_acao']
    assert_equal 'dormiu bem, treino moderado, sem dores', body['raw_input']
  end

  test 'event inclui todas as chaves esperadas' do
    post api_v1_coaching_contact_timeline_events_url(@athlete, format: :json),
         params: { raw_input: 'nota de teste' }, headers: @headers
    body = response.parsed_body['event']
    %w[id raw_input source sono carga observacao proxima_acao created_at].each do |key|
      assert body.key?(key), "Falta chave: #{key}"
    end
  end

  test 'events aparecem em ordem decrescente de criação' do
    e1 = TimelineEvent.create!(account: @account, contact: @athlete, raw_input: 'primeira nota', source: 'manual')
    e2 = TimelineEvent.create!(account: @account, contact: @athlete, raw_input: 'segunda nota',  source: 'manual')
    get api_v1_coaching_contact_timeline_events_url(@athlete, format: :json), headers: @headers
    ids = response.parsed_body['events'].map { |e| e['id'] }
    assert_equal [e2.id, e1.id], ids
  end

  test 'filtra events por query de busca' do
    TimelineEvent.create!(account: @account, contact: @athlete, raw_input: 'sono ruim hoje',   source: 'manual')
    TimelineEvent.create!(account: @account, contact: @athlete, raw_input: 'treino excelente', source: 'manual')
    get api_v1_coaching_contact_timeline_events_url(@athlete, format: :json),
        params: { q: 'sono' }, headers: @headers
    events = response.parsed_body['events']
    assert_equal 1, events.size
    assert_equal 'sono ruim hoje', events.first['raw_input']
  end

  test 'events não aparecem para outro contato' do
    outro = create_contact(@account)
    TimelineEvent.create!(account: @account, contact: outro, raw_input: 'não deve aparecer', source: 'manual')
    get api_v1_coaching_contact_timeline_events_url(@athlete, format: :json), headers: @headers
    assert_equal [], response.parsed_body['events']
  end

  test 'retorna 404 para contato inexistente em timeline' do
    get api_v1_coaching_contact_timeline_events_url(0, format: :json), headers: @headers
    assert_response :not_found
  end

  test 'requer autenticação para criar timeline event' do
    post api_v1_coaching_contact_timeline_events_url(@athlete, format: :json),
         params: { raw_input: 'sem auth' }
    assert_response :unauthorized
  end

  # --- Rascunho de feedback (IA) ---

  test 'gera rascunho de feedback para atleta' do
    CoachingProfile.create!(account: @account, contact: @athlete, last_feedback_at: 2.days.ago)
    TimelineEvent.create!(account: @account, contact: @athlete, raw_input: 'treino leve, sono bom', source: 'manual')
    post feedback_draft_api_v1_coaching_contact_url(@athlete, format: :json),
         params: { context: 'Atleta evoluiu na corrida esta semana' },
         headers: @headers
    assert_response :success
    assert_not_nil response.parsed_body['draft']
  end

  # --- Sumário pré-visita (IA) ---

  test 'gera sumário pré-visita para agendamento' do
    appt = create_appointment(status: :confirmed)
    post pre_visit_summary_api_v1_appointment_url(appt, format: :json), headers: @headers
    assert_response :success
    assert_not_nil response.parsed_body['summary']
  end

  private

  def next_weekday_at(hour)
    day = Date.current + 7.days
    day += 1.day while day.saturday? || day.sunday?
    Time.zone.local(day.year, day.month, day.day, hour, 0, 0)
  end

  def create_appointment(status: :pending, hour: 10)
    start_time = next_weekday_at(hour)
    @account.appointments.create!(
      account_user:    @account_user,
      service:         @service,
      contact:         @athlete,
      start_time:      start_time,
      end_time:        start_time + 1.hour,
      price_cents:     15_000,
      price_currency:  'BRL',
      whatsapp_number: '5541999990000',
      status:          status
    )
  end
end
