require "test_helper"

class Api::V1::AdminControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin_user, @admin_account = register_user(email: "admin_test@orbi.com")
    @admin_user.update!(admin: true)
    @regular_user, @regular_account = register_user(email: "user_test@example.com")
    @admin_token    = jwt_token_for(@admin_user)
    @regular_token  = jwt_token_for(@regular_user)
  end

  # ─── acesso ──────────────────────────────────────────────────────────────────

  test "rejeita não-admin em accounts" do
    get api_v1_admin_accounts_url(format: :json),
        headers: auth_header(@regular_token)
    assert_response :forbidden
  end

  test "rejeita não-admin em subscriptions" do
    get api_v1_admin_subscriptions_url(format: :json),
        headers: auth_header(@regular_token)
    assert_response :forbidden
  end

  # ─── accounts sem busca ───────────────────────────────────────────────────────

  test "lista contas sem busca" do
    get api_v1_admin_accounts_url(format: :json),
        headers: auth_header(@admin_token)
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("accounts")
    assert body.key?("pagination")
    assert body.key?("summary")
  end

  # ─── accounts com busca (o bug corrigido) ────────────────────────────────────

  test "busca de contas por email não retorna 500" do
    get api_v1_admin_accounts_url(format: :json, search: "example.com"),
        headers: auth_header(@admin_token)
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("accounts")
  end

  test "busca de contas por @gmail não retorna 500" do
    get api_v1_admin_accounts_url(format: :json, search: "@gmail"),
        headers: auth_header(@admin_token)
    assert_response :success
  end

  test "busca retorna conta cujo email bate com o termo" do
    get api_v1_admin_accounts_url(format: :json, search: "example"),
        headers: auth_header(@admin_token)
    assert_response :success
    body = JSON.parse(response.body)
    emails = body["accounts"].map { |a| a["email"] }
    assert emails.any? { |e| e.include?("example") }, "deve retornar conta com 'example' no email"
  end

  test "busca sem resultado retorna lista vazia e 200" do
    get api_v1_admin_accounts_url(format: :json, search: "zzznobodyXXX999"),
        headers: auth_header(@admin_token)
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [], body["accounts"]
  end

  # ─── subscriptions com busca ─────────────────────────────────────────────────

  test "busca de assinaturas por email não retorna 500" do
    get api_v1_admin_subscriptions_url(format: :json, search: "example.com"),
        headers: auth_header(@admin_token)
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("subscriptions")
  end

  # ─── dashboard ───────────────────────────────────────────────────────────────

  test "admin acessa dashboard" do
    get api_v1_admin_dashboard_url(format: :json),
        headers: auth_header(@admin_token)
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("summary")
  end

  private

  def jwt_token_for(user)
    Base64.strict_encode64({
      user_id: user.id,
      email: user.email,
      exp: 24.hours.from_now.to_i
    }.to_json)
  end

  def auth_header(token)
    { "Authorization" => "Bearer #{token}" }
  end
end
