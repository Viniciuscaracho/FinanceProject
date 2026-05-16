# frozen_string_literal: true

# == Schema Information
#
# Table name: pix_billings
#
#  id          :bigint           not null, primary key
#  amount      :integer          not null
#  billing_url :string
#  expires_at  :datetime
#  frequency   :string           default("MONTHLY"), not null
#  metadata    :jsonb            not null
#  paid_at     :datetime
#  plan_name   :string
#  status      :string           default("PENDING"), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  account_id  :bigint           not null
#  billing_id  :string           not null
#  plan_id     :string
#
# Indexes
#
#  index_pix_billings_on_account_id             (account_id)
#  index_pix_billings_on_account_id_and_status  (account_id,status)
#  index_pix_billings_on_billing_id             (billing_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require 'test_helper'

class PixBillingTest < ActiveSupport::TestCase
  setup do
    _user, @account = register_user
  end

  test 'valid with all required fields' do
    billing = PixBilling.new(
      account: @account,
      billing_id: 'bill_abc123',
      billing_url: 'https://abacatepay.com/pay/bill_abc123',
      amount: 4900,
      status: 'PENDING',
      frequency: 'MONTHLY',
      plan_name: 'Plano Básico'
    )
    assert billing.valid?, billing.errors.full_messages.to_s
  end

  test 'invalid without billing_id' do
    billing = PixBilling.new(account: @account, amount: 4900, status: 'PENDING')
    assert_not billing.valid?
    assert billing.errors[:billing_id].any?
  end

  test 'invalid with duplicate billing_id' do
    @account.pix_billings.create!(billing_id: 'bill_dup', amount: 4900, status: 'PENDING')
    dup = PixBilling.new(account: @account, billing_id: 'bill_dup', amount: 4900, status: 'PENDING')
    assert_not dup.valid?
    assert dup.errors[:billing_id].any?
  end

  test 'invalid with status outside allowed values' do
    billing = PixBilling.new(account: @account, billing_id: 'bill_bad', amount: 4900, status: 'UNKNOWN')
    assert_not billing.valid?
    assert billing.errors[:status].any?
  end

  test 'invalid with zero amount' do
    billing = PixBilling.new(account: @account, billing_id: 'bill_zero', amount: 0, status: 'PENDING')
    assert_not billing.valid?
    assert billing.errors[:amount].any?
  end

  test 'paid? returns true only when status is PAID' do
    billing = PixBilling.new(status: 'PAID')
    assert billing.paid?

    billing.status = 'PENDING'
    assert_not billing.paid?
  end

  test 'pending? returns true only when status is PENDING' do
    billing = PixBilling.new(status: 'PENDING')
    assert billing.pending?

    billing.status = 'PAID'
    assert_not billing.pending?
  end

  test 'pending scope filters correctly' do
    @account.pix_billings.create!(billing_id: 'bill_p1', amount: 100, status: 'PENDING')
    @account.pix_billings.create!(billing_id: 'bill_paid1', amount: 100, status: 'PAID')

    pending_ids = @account.pix_billings.pending.pluck(:billing_id)
    assert_includes pending_ids, 'bill_p1'
    assert_not_includes pending_ids, 'bill_paid1'
  end

  test 'paid scope filters correctly' do
    @account.pix_billings.create!(billing_id: 'bill_paid2', amount: 100, status: 'PAID', paid_at: Time.current)
    @account.pix_billings.create!(billing_id: 'bill_p2', amount: 100, status: 'PENDING')

    paid_ids = @account.pix_billings.paid.pluck(:billing_id)
    assert_includes paid_ids, 'bill_paid2'
    assert_not_includes paid_ids, 'bill_p2'
  end
end
