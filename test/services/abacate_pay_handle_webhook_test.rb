# frozen_string_literal: true

require 'test_helper'

class AbacatePayHandleWebhookTest < ActiveSupport::TestCase
  setup do
    _user, @account = register_user
    @pix_billing = @account.pix_billings.create!(
      billing_id: 'bill_svc_001',
      billing_url: 'https://abacatepay.com/pay/bill_svc_001',
      amount: 4900,
      status: 'PENDING',
      frequency: 'MONTHLY',
      plan_id: 'price_basic',
      plan_name: 'Plano Básico'
    )
  end

  test 'billing.paid creates a Subscription with active status' do
    result = BarberManagement::AbacatePay::HandleWebhook.call(
      event: { 'id' => 'bill_svc_001', 'amount' => 4900 },
      event_type: 'billing.paid'
    )

    assert result.success?
    @pix_billing.reload
    assert_equal 'PAID', @pix_billing.status
    assert_not_nil @pix_billing.paid_at

    sub = Subscription.find_by(processor_id: 'bill_svc_001')
    assert_not_nil sub
    assert_equal 'active', sub.status.to_s
    assert_equal @account.id, sub.account_id
    assert sub.current_period_end > Time.current
  end

  test 'billing.paid sets period of 1 month' do
    travel_to Time.zone.parse('2026-05-14 12:00:00') do
      BarberManagement::AbacatePay::HandleWebhook.call(
        event: { 'id' => 'bill_svc_001' },
        event_type: 'billing.paid'
      )
    end

    sub = Subscription.find_by(processor_id: 'bill_svc_001')
    expected_end = Time.zone.parse('2026-06-14 12:00:00')
    assert_in_delta expected_end.to_i, sub.current_period_end.to_i, 5
  end

  test 'billing.expired marks billing as EXPIRED' do
    BarberManagement::AbacatePay::HandleWebhook.call(
      event: { 'id' => 'bill_svc_001' },
      event_type: 'billing.expired'
    )

    assert_equal 'EXPIRED', @pix_billing.reload.status
  end

  test 'BILLING_EXPIRED uppercase also sets EXPIRED' do
    BarberManagement::AbacatePay::HandleWebhook.call(
      event: { 'id' => 'bill_svc_001' },
      event_type: 'BILLING_EXPIRED'
    )

    assert_equal 'EXPIRED', @pix_billing.reload.status
  end

  test 'billing.cancelled marks billing as CANCELLED' do
    BarberManagement::AbacatePay::HandleWebhook.call(
      event: { 'id' => 'bill_svc_001' },
      event_type: 'billing.cancelled'
    )

    assert_equal 'CANCELLED', @pix_billing.reload.status
  end

  test 'unknown event type leaves billing unchanged' do
    BarberManagement::AbacatePay::HandleWebhook.call(
      event: { 'id' => 'bill_svc_001' },
      event_type: 'billing.future_event'
    )

    assert_equal 'PENDING', @pix_billing.reload.status
  end

  test 'unknown billing_id does not raise — returns gracefully' do
    result = BarberManagement::AbacatePay::HandleWebhook.call(
      event: { 'id' => 'bill_does_not_exist' },
      event_type: 'billing.paid'
    )

    assert result.success?
  end

  test 'billing.paid is idempotent — second call updates existing subscription' do
    params = { event: { 'id' => 'bill_svc_001' }, event_type: 'billing.paid' }

    BarberManagement::AbacatePay::HandleWebhook.call(**params)
    first_sub_count = Subscription.count

    BarberManagement::AbacatePay::HandleWebhook.call(**params)
    assert_equal first_sub_count, Subscription.count
  end
end
