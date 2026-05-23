# frozen_string_literal: true

require 'test_helper'

class Api::V1::GoogleContactsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @auth_token = generate_auth_token(@user)

    @account.update_columns(
      google_contacts_access_token:     'valid_token',
      google_contacts_refresh_token:    'refresh_token',
      google_contacts_token_expires_at: 1.hour.from_now,
      google_contacts_connected:        true
    )
  end

  # ─────────────────────────────────────────────────────────────────────────
  # STATUS
  # ─────────────────────────────────────────────────────────────────────────

  test "status returns connected true when google contacts is connected" do
    get '/api/v1/google_contacts/status',
        headers: { 'Authorization' => "Bearer #{@auth_token}" },
        as: :json

    assert_response :success
    assert JSON.parse(response.body)['connected']
  end

  test "status returns connected false when google contacts is not connected" do
    @account.update_columns(google_contacts_connected: false)

    get '/api/v1/google_contacts/status',
        headers: { 'Authorization' => "Bearer #{@auth_token}" },
        as: :json

    assert_response :success
    assert_not JSON.parse(response.body)['connected']
  end

  test "status requires authentication" do
    get '/api/v1/google_contacts/status', as: :json
    assert_response :unauthorized
  end

  # ─────────────────────────────────────────────────────────────────────────
  # IMPORT — casos normais
  # ─────────────────────────────────────────────────────────────────────────

  test "import cria contato novo com email" do
    assert_difference 'Contact.count', 1 do
      post '/api/v1/google_contacts/import',
           params: { contacts: [{ name: 'João Silva', email: 'joao@exemplo.com', phone: '11999999999' }] },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['imported']
    assert_equal 0, body['skipped']
  end

  test "import cria contato sem email" do
    assert_difference 'Contact.count', 1 do
      post '/api/v1/google_contacts/import',
           params: { contacts: [{ name: 'Maria Souza', email: '', phone: '11988887777' }] },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['imported']
    assert_equal 0, body['skipped']
  end

  test "import rejeita lista vazia" do
    post '/api/v1/google_contacts/import',
         params: { contacts: [] },
         headers: { 'Authorization' => "Bearer #{@auth_token}" },
         as: :json

    assert_response :unprocessable_entity
  end

  # ─────────────────────────────────────────────────────────────────────────
  # IMPORT — deduplicação por email
  # ─────────────────────────────────────────────────────────────────────────

  test "import pula contato cujo email já existe na conta" do
    create_contact(@account, email: 'existente@exemplo.com')

    assert_no_difference 'Contact.count' do
      post '/api/v1/google_contacts/import',
           params: { contacts: [{ name: 'Existente', email: 'existente@exemplo.com', phone: '11900000001' }] },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body['imported']
    assert_equal 1, body['skipped']
  end

  test "import pula email duplicado dentro do mesmo lote (dois registros com mesmo email)" do
    # Dois contatos com o mesmo email no mesmo request não devem criar dois registros
    assert_difference 'Contact.count', 1 do
      post '/api/v1/google_contacts/import',
           params: {
             contacts: [
               { name: 'Contato A', email: 'duplicado@exemplo.com', phone: '11900000001' },
               { name: 'Contato A cópia', email: 'duplicado@exemplo.com', phone: '11900000002' }
             ]
           },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['imported']
    assert_equal 1, body['skipped'], 'O segundo contato com mesmo email deve ser contado como skipped (dedup)'
  end

  test "import importando a mesma lista duas vezes não duplica contatos com email" do
    contacts_payload = [
      { name: 'Pedro Nunes', email: 'pedro@exemplo.com', phone: '11900001111' },
      { name: 'Ana Lima',    email: 'ana@exemplo.com',   phone: '11900002222' }
    ]

    # Primeira importação
    post '/api/v1/google_contacts/import',
         params: { contacts: contacts_payload },
         headers: { 'Authorization' => "Bearer #{@auth_token}" },
         as: :json
    assert_response :success
    assert_equal 2, JSON.parse(response.body)['imported']

    # Segunda importação — nenhum novo contato deve ser criado
    assert_no_difference 'Contact.count' do
      post '/api/v1/google_contacts/import',
           params: { contacts: contacts_payload },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end

    body = JSON.parse(response.body)
    assert_equal 0, body['imported']
    assert_equal 2, body['skipped']
  end

  # ─────────────────────────────────────────────────────────────────────────
  # IMPORT — risco de duplicidade para contatos SEM email
  # ─────────────────────────────────────────────────────────────────────────
  #
  # ATENÇÃO: o código atual NÃO tem guard para contatos sem email.
  # O bloco abaixo documenta esse comportamento e serve como alerta:
  # se o teste falhar no futuro, significa que o guard foi adicionado (bom!).
  #
  test "RISCO: importar contato sem email duas vezes cria duplicata (sem dedup por telefone)" do
    payload = [{ name: 'Sem Email', email: '', phone: '11977776666' }]

    # Primeira importação
    post '/api/v1/google_contacts/import',
         params: { contacts: payload },
         headers: { 'Authorization' => "Bearer #{@auth_token}" },
         as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body)['imported']

    # Segunda importação — sem guard de phone_number, cria duplicata
    assert_difference 'Contact.count', 1,
      'Contatos sem email são importados novamente porque não há dedup por telefone. ' \
      'Se este teste falhar com assert_no_difference, parabéns: o guard foi implementado!' do
      post '/api/v1/google_contacts/import',
           params: { contacts: payload },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end
  end

  # ─────────────────────────────────────────────────────────────────────────
  # IMPORT — isolamento de tenant
  # ─────────────────────────────────────────────────────────────────────────

  test "import não pula email que existe em outra conta (isolamento de tenant)" do
    _, other_account = register_user
    create_contact(other_account, email: 'outro@exemplo.com')

    # O mesmo email na conta corrente ainda deve ser importado
    assert_difference 'Contact.count', 1 do
      post '/api/v1/google_contacts/import',
           params: { contacts: [{ name: 'Outro Conta', email: 'outro@exemplo.com', phone: '' }] },
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['imported']
  end

  test "import requer autenticação" do
    post '/api/v1/google_contacts/import',
         params: { contacts: [{ name: 'Test', email: 'test@test.com', phone: '' }] },
         as: :json

    assert_response :unauthorized
  end

  test "import retorna erro quando google contacts não está conectado" do
    @account.update_columns(google_contacts_connected: false)

    post '/api/v1/google_contacts/import',
         params: { contacts: [{ name: 'Test', email: 'test@test.com', phone: '' }] },
         headers: { 'Authorization' => "Bearer #{@auth_token}" },
         as: :json

    assert_response :unprocessable_entity
  end

  # ─────────────────────────────────────────────────────────────────────────
  # LIST — mock da API do Google
  # ─────────────────────────────────────────────────────────────────────────

  test "list retorna contatos do Google quando conectado" do
    google_response = {
      'connections' => [
        {
          'names' => [{ 'displayName' => 'Carlos Teste' }],
          'emailAddresses' => [{ 'value' => 'carlos@google.com' }],
          'phoneNumbers' => [{ 'value' => '11999991111' }]
        }
      ]
    }

    mock_response = mock('response')
    mock_response.stubs(:parsed_response).returns(google_response)
    HTTParty.stubs(:get).returns(mock_response)

    get '/api/v1/google_contacts/list',
        headers: { 'Authorization' => "Bearer #{@auth_token}" },
        as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['contacts'].length
    assert_equal 'Carlos Teste', body['contacts'].first['name']
    assert_equal 'carlos@google.com', body['contacts'].first['email']
  end

  test "list retorna 401 quando token expirado e refresh falha" do
    @account.update_columns(google_contacts_token_expires_at: 1.hour.ago)

    error_response = mock('response')
    error_response.stubs(:parsed_response).returns({ 'error' => 'invalid_grant' })
    HTTParty.stubs(:post).returns(error_response)

    get '/api/v1/google_contacts/list',
        headers: { 'Authorization' => "Bearer #{@auth_token}" },
        as: :json

    assert_response :unauthorized
  end

  # ─────────────────────────────────────────────────────────────────────────
  # DISCONNECT
  # ─────────────────────────────────────────────────────────────────────────

  test "disconnect limpa tokens e marca como desconectado" do
    delete '/api/v1/google_contacts/disconnect',
           headers: { 'Authorization' => "Bearer #{@auth_token}" },
           as: :json

    assert_response :success
    @account.reload
    assert_not @account.google_contacts_connected
    assert_nil @account.google_contacts_access_token
    assert_nil @account.google_contacts_refresh_token
    assert_nil @account.google_contacts_token_expires_at
  end
end
