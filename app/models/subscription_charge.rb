# == Schema Information
#
# Table name: subscription_charges
#
#  id                           :bigint           not null, primary key
#  amount_captured_cents        :bigint           default(0), not null
#  amount_cents                 :bigint           default(0), not null
#  amount_refunded_cents        :bigint           default(0), not null
#  application_fee_amount_cents :bigint           default(0), not null
#  currency                     :string(3)        default("BRL"), not null
#  data                         :jsonb            not null
#  invoice                      :jsonb            not null
#  metadata                     :jsonb            not null
#  status                       :string           not null
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  account_id                   :bigint           not null
#  processor_id                 :string           not null
#  subscription_id              :bigint           not null
#  subscription_invoice_id      :bigint           not null
#
# Indexes
#
#  index_subscription_charges_on_account_id               (account_id)
#  index_subscription_charges_on_composed_index           (account_id,subscription_id,subscription_invoice_id,processor_id)
#  index_subscription_charges_on_processor_id             (processor_id) UNIQUE
#  index_subscription_charges_on_status                   (status)
#  index_subscription_charges_on_subscription_id          (subscription_id)
#  index_subscription_charges_on_subscription_invoice_id  (subscription_invoice_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (subscription_id => subscriptions.id)
#  fk_rails_...  (subscription_invoice_id => subscription_invoices.id)
#
class SubscriptionCharge < ApplicationRecord
  audited only: %i[processor_id subscription_id subscription_invoice_id status data metadata amount_cents amount_captured_cents amount_refunded_cents currency],
          associated_with: :account, on: %i[create update destroy]

  SUBSCRIPTION_CHARGE_STATUSES = %i[pending succeeded failed].freeze
  as_enum :status, SUBSCRIPTION_CHARGE_STATUSES, map: :string, source: :status

  store_accessor :data, :description, :paid, :captured, :refunded, :disputed, :failure_message, :receipt_url, :payment_method_details

  monetize :amount_cents,                 with_model_currency: :currency
  monetize :amount_captured_cents,        with_model_currency: :currency
  monetize :amount_refunded_cents,        with_model_currency: :currency
  monetize :application_fee_amount_cents, with_model_currency: :currency

  belongs_to :account
  belongs_to :subscription
  belongs_to :subscription_invoice

  has_one_attached :invoice_pdf, dependent: :purge_later
  has_one_attached :invoice_xml, dependent: :purge_later

  def payment_method_details
    OpenStruct.new(super || {})
  end

  delegate :type, to: :payment_method_details, prefix: :payment_method

  def card?
    payment_method_type == 'card'
  end

  def card_payment_fail?
    card? && failed?
  end

  def bank_slip?
    payment_method_type == 'boleto'
  end

  def bank_slip_payment_fail?
    card? && failed?
  end

  def assign_stripe_attributes(stripe_charge)
    assign_attributes(
      processor_id: stripe_charge.id,
      status: stripe_charge.status,
      amount_cents: stripe_charge.amount,
      amount_captured_cents: stripe_charge.amount_captured,
      amount_refunded_cents: stripe_charge.amount_refunded,
      currency: stripe_charge.currency.upcase,
      metadata: stripe_charge.metadata.to_hash,
      data: stripe_charge.to_hash
    )
  end

  def sync!(stripe_charge = nil)
    stripe_charge ||= Stripe::Charge.retrieve(processor_id)
    assign_stripe_attributes(stripe_charge)
    save
  end
end
