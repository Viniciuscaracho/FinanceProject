# frozen_string_literal: true

require 'test_helper'

# Testa os endpoints de pagamento PIX (/api/v1/pix_payments/*) sem
# chamar a API real do AbacatePay — usa Mocha para stub de
# BarberManagement::AbacatePay::CreateBilling.call.
class PixPaymentsTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @token = generate_auth_token(@user)
    @auth_headers = { 'Authorization' => "Bearer #{@token}", 'Content-Type' => 'application/json' }
  end

  # ── POST /api/v1/pix_payments/create_billing ──────────────────────────────

  test 'create_billing returns billing_url on success' do
    pix_billing = @account.pix_billings.new(
      billing_id: 'bill_new_001',
      billing_url: 'https://abacatepay.com/pay/bill_new_001',
      amount: 4900,
      status: 'PENDING'
    )
    result_stub = stub(
      success?: true,
      billing_url: 'https://abacatepay.com/pay/bill_new_001',
      pix_billing: pix_billing
    )
    BarberManagement::AbacatePay::CreateBilling.stubs(:call).returns(result_stub)

    post create_billing_api_v1_pix_payments_url,
      params: { amount: 4900, plan_id: 'price_basic', plan_name: 'Plano Básico' }.to_json,
      headers: @auth_headers

    assert_response :success
    body = response.parsed_body
    assert_equal 'https://abacatepay.com/pay/bill_new_001', body['billing_url']
    assert_equal 'bill_new_001', body['billing_id']
    assert_equal 'PENDING', body['status']
  end

  test 'create_billing returns 400 when amount is missing' do
    post create_billing_api_v1_pix_payments_url,
      params: { plan_name: 'Plano Básico' }.to_json,
      headers: @auth_headers

    assert_response :bad_request
    assert_includes response.parsed_body['error'], 'amount'
  end

  test 'create_billing returns 400 when plan_name is missing' do
    post create_billing_api_v1_pix_payments_url,
      params: { amount: 4900 }.to_json,
      headers: @auth_headers

    assert_response :bad_request
    assert_includes response.parsed_body['error'], 'plan_name'
  end

  test 'create_billing returns 422 when AbacatePay service fails' do
    result_stub = stub(success?: false, error: 'AbacatePay API error (401): Unauthorized')
    BarberManagement::AbacatePay::CreateBilling.stubs(:call).returns(result_stub)

    post create_billing_api_v1_pix_payments_url,
      params: { amount: 4900, plan_name: 'Plano Básico' }.to_json,
      headers: @auth_headers

    assert_response :unprocessable_entity
    assert response.parsed_body['error'].present?
  end

  test 'create_billing requires authentication' do
    post create_billing_api_v1_pix_payments_url,
      params: { amount: 4900, plan_name: 'Plano Básico' }.to_json,
      headers: { 'Content-Type' => 'application/json' }

    assert_response :unauthorized
  end

  # ── GET /api/v1/pix_payments/status/:billing_id ──────────────────────────

  test 'status returns billing info when found' do
    billing = @account.pix_billings.create!(
      billing_id: 'bill_status_001',
      billing_url: 'https://abacatepay.com/pay/bill_status_001',
      amount: 4900,
      status: 'PENDING',
      plan_name: 'Plano Básico'
    )

    get "/api/v1/pix_payments/status/#{billing.billing_id}",
      headers: @auth_headers.except('Content-Type')

    assert_response :success
    body = response.parsed_body
    assert_equal 'bill_status_001', body['billing_id']
    assert_equal 'PENDING', body['status']
    assert_equal 4900, body['amount']
  end

  test 'status returns 404 for unknown billing_id' do
    get '/api/v1/pix_payments/status/bill_nonexistent',
      headers: @auth_headers.except('Content-Type')

    assert_response :not_found
  end

  test 'status returns PAID after webhook activates billing' do
    billing = @account.pix_billings.create!(
      billing_id: 'bill_paid_status',
      amount: 4900,
      status: 'PENDING'
    )
    billing.update!(status: 'PAID', paid_at: Time.current)

    get "/api/v1/pix_payments/status/#{billing.billing_id}",
      headers: @auth_headers.except('Content-Type')

    assert_response :success
    assert_equal 'PAID', response.parsed_body['status']
    assert_not_nil response.parsed_body['paid_at']
  end

  # ── GET /api/v1/pix_payments (index) ─────────────────────────────────────

  test 'index returns pix_billings for account' do
    @account.pix_billings.create!(billing_id: 'bill_idx_1', amount: 4900, status: 'PENDING')
    @account.pix_billings.create!(billing_id: 'bill_idx_2', amount: 9900, status: 'PAID', paid_at: Time.current)

    get api_v1_pix_payments_url, headers: @auth_headers.except('Content-Type')

    assert_response :success
    ids = response.parsed_body['pix_billings'].map { |b| b['billing_id'] }
    assert_includes ids, 'bill_idx_1'
    assert_includes ids, 'bill_idx_2'
  end

  test 'index does not leak billings from other accounts' do
    _other_user, other_account = register_user
    other_account.pix_billings.create!(billing_id: 'bill_other_acct', amount: 100, status: 'PENDING')

    get api_v1_pix_payments_url, headers: @auth_headers.except('Content-Type')

    assert_response :success
    ids = response.parsed_body['pix_billings'].map { |b| b['billing_id'] }
    assert_not_includes ids, 'bill_other_acct'
  end
end
