# == Schema Information
#
# Table name: subscriptions
#
#  id                   :bigint           not null, primary key
#  cancel_at_period_end :boolean          default(FALSE), not null
#  current_period_end   :datetime         not null
#  current_period_start :datetime         not null
#  data                 :jsonb            not null
#  metadata             :jsonb            not null
#  name                 :string           not null
#  status               :string           not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint           not null
#  processor_id         :string           not null
#  processor_plan_id    :string
#  processor_product_id :string
#
# Indexes
#
#  index_subscriptions_on_account_id                   (account_id)
#  index_subscriptions_on_account_id_and_processor_id  (account_id,processor_id)
#  index_subscriptions_on_processor_id                 (processor_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Subscription < ApplicationRecord
  audited only: %i[processor_id name status data metadata current_period_start current_period_end cancel_at_period_end],
          associated_with: :account, on: %i[create update destroy]

  ACCESS_GRANTING_STATUSES = %i[trialing active past_due].freeze
  SUBSCRIPTION_STATUSES = %i[incomplete incomplete_expired trialing active past_due canceled unpaid].freeze

  store_accessor :data, :plan, :collection_method

  as_enum :status, SUBSCRIPTION_STATUSES, map: :string, source: :status

  belongs_to :account

  has_one :current_account, class_name: 'Account', foreign_key: :subscription_id, inverse_of: :subscription, dependent: :nullify

  has_many :subscription_charges, dependent: :destroy
  has_many :subscription_invoices, dependent: :destroy

  scope :active_or_trialing, -> { where(status: ACCESS_GRANTING_STATUSES) }

  validates :processor_id, presence: true, uniqueness: true
  validates :status, presence: true
  validates :cancel_at_period_end, inclusion: { in: [true, false] }
  validates :current_period_start, presence: true
  validates :current_period_end, presence: true

  after_save_commit do
    publish 'subscription_upserted', record: self
  end

  def plan
    OpenStruct.new(super || {})
  end

  delegate :id, :metadata, :nickname, :product, to: :plan, prefix: true, allow_nil: true

  def plan_metadata
    OpenStruct.new(plan.metadata || {})
  end

  delegate :account_type, :max_active_users, :max_storage_size_in_bytes, to: :plan_metadata, allow_nil: true

  def assign_stripe_attributes(stripe_subscription)
    assign_attributes(
      processor_id: stripe_subscription.id,
      processor_plan_id: stripe_subscription.plan.id,
      processor_product_id: stripe_subscription.plan&.product,
      name: "#{account.name} - #{stripe_subscription.plan&.nickname}",
      status: stripe_subscription.status,
      cancel_at_period_end: stripe_subscription.cancel_at_period_end,
      current_period_start: Time.zone.at(stripe_subscription.current_period_start),
      current_period_end: Time.zone.at(stripe_subscription.current_period_end),
      data: stripe_subscription.to_hash,
      metadata: stripe_subscription.metadata.to_hash
    )
  end

  def access_granted?
    ACCESS_GRANTING_STATUSES.include?(status)
  end

  def cancel_requested?
    cancel_at_period_end?
  end

  def first_charge_failed?
    incomplete? && subscription_charges.one? && subscription_charges.order(:id).last.failed?
  end

  def one_charge_failed?
    subscription_charges.order(:id).last.failed?
  end

  def first_charge_pending?
    incomplete? && !subscription_charges.exists?
  end

  def current_failure_message
    subscription_charges.order(:id).last.failure_message
  end

  def plan_primary?
    Account::ACCOUNT_TYPES.keys.include?(account_type&.to_sym)
  end

  def max_active_users
    plan_metadata&.max_active_users&.to_i || 1
  end

  def max_storage_size_in_bytes
    plan_metadata&.max_storage_size_in_bytes&.to_i
  end

  def plan_additional?
    !plan_primary?
  end

  def charged_automatically?
    collection_method == 'charge_automatically'
  end

  def charged_manually?
    collection_method == 'charge_manually'
  end

  def sync!(stripe_subscription = nil)
    stripe_subscription ||= ::Stripe::Subscription.retrieve(processor_id)
    assign_stripe_attributes(stripe_subscription)
    save!
  end

  def sync_invoices!
    ::Stripe::Invoice.list({ subscription: processor_id }).auto_paging_each do |stripe_invoice|
      subscription_invoice = subscription_invoices.find_or_initialize_by(account:, processor_id: stripe_invoice.id)
      subscription_invoice.sync!(stripe_invoice)
      subscription_invoice.sync_charges!(stripe_invoice)
    end
  end
end
