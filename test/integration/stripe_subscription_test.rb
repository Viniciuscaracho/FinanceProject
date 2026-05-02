# frozen_string_literal: true

require 'test_helper'

# Testa os endpoints de assinatura sem chamar o Stripe real.
# Subscription#cancel e #reactivate têm branches para processor_id "sub_test_*"
# que operam apenas no banco local — útil para CI sem credenciais Stripe.
class StripeSubscriptionTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @token = generate_auth_token(@user)
    @auth_headers = { 'Authorization' => "Bearer #{@token}" }
  end

  # GET /api/v1/subscriptions — sem assinatura
  test 'returns nil subscription when account has none' do
    get api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal false, body['subscribed']
    assert_nil body['subscription']
  end

  # GET /api/v1/subscriptions — com assinatura ativa
  test 'returns active subscription details' do
    sub = create_subscription(@account, processor_id: 'sub_test_active_001', status: :active)
    @account.update!(subscription_id: sub.id)

    get api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal true, body['subscribed']
    assert_equal 'active', body.dig('subscription', 'status')
    assert_equal sub.id, body.dig('subscription', 'id')
  end

  # POST /api/v1/subscriptions/cancel — cancela subscription de teste localmente
  test 'cancels test subscription locally without calling Stripe' do
    sub = create_subscription(
      @account,
      processor_id: 'sub_test_cancel_001',
      status: :active,
      cancel_at_period_end: false
    )
    @account.update!(subscription_id: sub.id)

    post cancel_api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal true, body.dig('subscription', 'cancel_at_period_end')
    assert_equal 'canceled', body.dig('subscription', 'status')
    assert_equal 'canceled', sub.reload.status.to_s
  end

  # POST /api/v1/subscriptions/reactivate — reativa subscription de teste localmente
  test 'reactivates test subscription locally without calling Stripe' do
    sub = create_subscription(
      @account,
      processor_id: 'sub_test_reactivate_001',
      status: :canceled,
      cancel_at_period_end: true
    )
    @account.update!(subscription_id: sub.id)

    post reactivate_api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal false, body.dig('subscription', 'cancel_at_period_end')
    assert_equal 'active', body.dig('subscription', 'status')
    assert_equal 'active', sub.reload.status.to_s
  end

  # POST /api/v1/subscriptions/cancel — sem assinatura retorna 404
  test 'returns not_found when canceling without subscription' do
    post cancel_api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :not_found
  end

  # POST /api/v1/subscriptions/reactivate — sem assinatura retorna 404
  test 'returns not_found when reactivating without subscription' do
    post reactivate_api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :not_found
  end

  # POST /api/v1/subscriptions/create_checkout — plano ausente retorna 400
  test 'create_checkout requires plan_id' do
    post create_checkout_api_v1_subscriptions_url, headers: @auth_headers, as: :json
    assert_response :bad_request
    body = response.parsed_body
    assert_includes body['error'], 'plan_id'
  end

  # Acesso sem token retorna 401
  test 'requires authentication' do
    get api_v1_subscriptions_url, as: :json
    assert_response :unauthorized
  end
end
