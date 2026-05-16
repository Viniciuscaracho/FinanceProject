# frozen_string_literal: true

require 'test_helper'

# Testa o endpoint POST /webhooks/abacate_pay sem chamar a API real do AbacatePay.
# Simula os eventos billing.paid e billing.expired verificando o efeito
# no PixBilling e na Subscription associada.
class AbacatePayWebhookTest < ActionDispatch::IntegrationTest
  WEBHOOK_URL = '/webhooks/abacate_pay'

  setup do
    _user, @account = register_user
    @pix_billing = @account.pix_billings.create!(
      billing_id: 'bill_test_001',
      billing_url: 'https://abacatepay.com/pay/bill_test_001',
      amount: 4900,
      status: 'PENDING',
      frequency: 'MONTHLY',
      plan_id: 'price_basic',
      plan_name: 'Plano Básico'
    )
  end

  # ── billing.paid ─────────────────────────────────────────────────────────────

  test 'billing.paid marks pix_billing as PAID and creates Subscription' do
    payload = billing_paid_payload('bill_test_001')

    assert_difference -> { Subscription.count }, 1 do
      post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    end

    assert_response :ok
    @pix_billing.reload
    assert_equal 'PAID', @pix_billing.status
    assert_not_nil @pix_billing.paid_at

    sub = Subscription.find_by(processor_id: 'bill_test_001')
    assert_not_nil sub
    assert_equal 'active', sub.status.to_s
    assert_equal @account.id, sub.account_id
  end

  test 'billing.paid with uppercase event key also works' do
    payload = { 'event' => 'BILLING_PAID', 'billing' => { 'id' => 'bill_test_001' } }

    post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    assert_response :ok
    assert_equal 'PAID', @pix_billing.reload.status
  end

  test 'billing.paid for unknown billing_id returns ok without error' do
    payload = billing_paid_payload('bill_nonexistent_999')
    post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    assert_response :ok
  end

  test 'billing.paid is idempotent — second call does not create duplicate subscription' do
    payload = billing_paid_payload('bill_test_001')

    post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    assert_response :ok

    assert_no_difference -> { Subscription.count } do
      post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    end

    assert_response :ok
  end

  # ── billing.expired ───────────────────────────────────────────────────────────

  test 'billing.expired marks pix_billing as EXPIRED' do
    payload = { 'event' => 'billing.expired', 'billing' => { 'id' => 'bill_test_001' } }

    post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    assert_response :ok
    assert_equal 'EXPIRED', @pix_billing.reload.status
  end

  test 'BILLING_EXPIRED (uppercase) also marks as EXPIRED' do
    payload = { 'event' => 'BILLING_EXPIRED', 'billing' => { 'id' => 'bill_test_001' } }

    post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    assert_response :ok
    assert_equal 'EXPIRED', @pix_billing.reload.status
  end

  # ── error handling ────────────────────────────────────────────────────────────

  test 'returns 400 for invalid JSON body' do
    post WEBHOOK_URL, params: 'NOT_JSON{{{', headers: json_headers
    assert_response :bad_request
  end

  test 'returns ok for unknown event types without crashing' do
    payload = { 'event' => 'billing.some_future_event', 'billing' => { 'id' => 'bill_test_001' } }
    post WEBHOOK_URL, params: payload.to_json, headers: json_headers
    assert_response :ok
    assert_equal 'PENDING', @pix_billing.reload.status
  end

  private

  def json_headers
    { 'Content-Type' => 'application/json' }
  end

  def billing_paid_payload(billing_id)
    {
      'event' => 'billing.paid',
      'billing' => {
        'id' => billing_id,
        'amount' => 4900,
        'status' => 'PAID',
        'methods' => ['PIX'],
        'frequency' => 'MONTHLY'
      }
    }
  end
end
