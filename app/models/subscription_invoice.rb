# == Schema Information
#
# Table name: subscription_invoices
#
#  id              :bigint           not null, primary key
#  data            :jsonb            not null
#  invoiced_at     :datetime
#  metadata        :jsonb            not null
#  status          :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  processor_id    :string           not null
#  subscription_id :bigint           not null
#
# Indexes
#
#  index_subscription_invoices_on_account_id       (account_id)
#  index_subscription_invoices_on_composed_index   (account_id,subscription_id,processor_id)
#  index_subscription_invoices_on_processor_id     (processor_id) UNIQUE
#  index_subscription_invoices_on_subscription_id  (subscription_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (subscription_id => subscriptions.id)
#
class SubscriptionInvoice < ApplicationRecord
  include Integrations::NuvemFiscal::Invoiceable

  SUBSCRIPTION_INVOICE_STATUSES = %i[draft open void paid uncollectible].freeze

  # add modules
  as_enum :status, SUBSCRIPTION_INVOICE_STATUSES, map: :string, source: :status
  has_prefix_id :si, override_find: false, override_param: false
  audited only: %i[processor_id subscription_id status data metadata], associated_with: :account, on: %i[create update destroy]

  scope :pending_current_month, -> { where(invoiced_at: nil, status: :paid, created_at: Time.zone.now.beginning_of_month..Time.zone.now) }

  store_accessor :data, :total, :amount_paid, :currency
  store_accessor :metadata, :payment_intent_status, :payment_intent_next_action_type, :payment_intent_next_action_voucher_url

  belongs_to :account
  belongs_to :subscription

  has_many :subscription_charges, dependent: :destroy

  after_create_commit do
    publish('subscription_invoice_created', record: self)
    publish('subscription_invoice_paid', record: self) if paid?
  end

  after_update_commit do
    publish('subscription_invoice_updated', record: self)
    publish('subscription_invoice_paid', record: self) if status_previously_changed? && paid?
  end

  def name
    processor_id
  end

  def assign_stripe_attributes(stripe_invoice)
    assign_attributes(
      processor_id: stripe_invoice.id,
      status: stripe_invoice.status,
      metadata: stripe_invoice.metadata.to_hash,
      data: stripe_invoice.to_hash
    )
  end

  def sync!(stripe_invoice = nil)
    stripe_invoice ||= ::Stripe::Invoice.retrieve(processor_id)
    assign_stripe_attributes(stripe_invoice)
    save
  end

  def sync_charges!(stripe_invoice = nil)
    stripe_invoice ||= ::Stripe::Invoice.retrieve(processor_id)
    return if stripe_invoice.charge.blank?

    subscription_charge = subscription_charges.find_or_initialize_by(account:, subscription:, processor_id: stripe_invoice.charge)
    stripe_charge = ::Stripe::Charge.retrieve(stripe_invoice.charge)
    return if stripe_charge.blank?

    subscription_charge.sync!(stripe_charge)
  end

  def able_to_send_nfse?
    return false if invoiced?
    return false unless paid?
    return false if prestador.account == tomador.account

    prestador.able_to_transmit_nfse? && tomador.able_to_receive_nfse?
  end

  def referencia
    prefix_id
  end

  def prestador
    Account.barber_management_account.company
  end

  def tomador
    account.company
  end

  def data_hora_emissao
    Time.zone.now.strftime('%Y-%m-%dT%H:%M:%SZ')
  end

  def data_competencia
    Time.zone.now.strftime('%Y-%m-%d')
  end

  def valor_servico
    Money.from_cents(amount_paid, currency.upcase).to_f
  end

  def descricao_servico
    "BarberManagement - #{account.processor_plan_name} - Ref #{I18n.l(Time.zone.now, format: :month).titleize}"
  end

  def tributacao_issqn
    prestador.nfse_config.iss_service_provided_tax_cd
  end

  def aliquota
    prestador.nfse_config.iss_tax_rate.to_f
  end

  def tipo_retencao_issqn
    prestador.nfse_config.iss_withholding_type_cd
  end
end
