# frozen_string_literal: true

require 'test_helper'

# Testa o endpoint de webhook do Stripe (/webhooks/stripe) sem fazer chamadas reais.
# Usa Mocha para stubbar Stripe::Webhook.construct_event e os handlers de eventos,
# evitando a necessidade de chaves reais ou de uma conta Stripe em modo teste.
class StripeWebhookTest < ActionDispatch::IntegrationTest
  WEBHOOK_URL = '/webhooks/stripe'
  STRIPE_SIG  = 'whsec_test_signature'

  def stripe_headers
    { 'Stripe-Signature' => STRIPE_SIG, 'Content-Type' => 'application/json' }
  end

  def build_event(type, object_attrs = {})
    object = Stripe::StripeObject.construct_from(object_attrs.merge(object: type.split('.').last))
    Stripe::Event.construct_from(
      id: "evt_test_#{SecureRandom.hex(6)}",
      type: type,
      data: { object: object.as_json },
      livemode: false,
      created: Time.now.to_i
    )
  end

  # --- invoice.payment_succeeded ---

  test 'processes invoice.payment_succeeded and returns 200' do
    event = build_event('invoice.payment_succeeded',
      id: 'in_test_001',
      status: 'paid',
      subscription: 'sub_test_001',
      metadata: { 'source' => 'barber_management' }
    )

    Stripe::Webhook.stubs(:construct_event).returns(event)
    BarberManagement::Stripe::WebhookHandler.stubs(:call).returns(stub(success?: true))

    post WEBHOOK_URL, headers: stripe_headers, params: '{}'
    assert_response :ok
  end

  # --- customer.subscription.deleted ---

  test 'processes customer.subscription.deleted and returns 200' do
    event = build_event('customer.subscription.deleted',
      id: 'sub_test_001',
      status: 'canceled',
      metadata: {}
    )

    Stripe::Webhook.stubs(:construct_event).returns(event)
    # BarberManagement handler não reconhece o evento sem metadata → fallback handler
    BarberManagement::Stripe::WebhookHandler.stubs(:call).returns(stub(success?: false))
    SubscriptionWebhooks::Create.stubs(:call).returns(stub(success?: true))

    post WEBHOOK_URL, headers: stripe_headers, params: '{}'
    assert_response :ok
  end

  # --- checkout.session.completed com metadata do BarberManagement ---

  test 'routes checkout.session.completed to BarberManagement handler' do
    event = build_event('checkout.session.completed',
      id: 'cs_test_001',
      client_reference_id: '42',
      metadata: { 'source' => 'barber_management' }
    )

    Stripe::Webhook.stubs(:construct_event).returns(event)
    handler_result = stub(success?: true)
    BarberManagement::Stripe::WebhookHandler.expects(:call).with(event: event).returns(handler_result)

    post WEBHOOK_URL, headers: stripe_headers, params: '{}'
    assert_response :ok
  end

  # --- assinatura inválida retorna 400 ---

  test 'returns bad_request on invalid signature' do
    Stripe::Webhook.stubs(:construct_event).raises(
      Stripe::SignatureVerificationError.new('Assinatura inválida', STRIPE_SIG)
    )

    post WEBHOOK_URL, headers: stripe_headers, params: '{}'
    assert_response :bad_request
  end

  # --- payload malformado retorna 400 ---

  test 'returns bad_request on malformed JSON' do
    Stripe::Webhook.stubs(:construct_event).raises(JSON::ParserError.new('unexpected token'))

    post WEBHOOK_URL, headers: stripe_headers, params: 'not-json'
    assert_response :bad_request
  end
end
