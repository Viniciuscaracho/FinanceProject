# frozen_string_literal: true

module Accounts
  module SubscriptionControl
    extend ActiveSupport::Concern

    included do
      as_enum :subscription_status, Subscription::SUBSCRIPTION_STATUSES, map: :string, source: :subscription_status

      belongs_to :subscription, optional: true
      delegate :first_charge_failed?, :first_charge_pending?, to: :subscription, allow_nil: true

      has_many   :subscriptions,         dependent: :destroy
      has_many   :subscription_charges,  dependent: :destroy
      has_many   :subscription_invoices, dependent: :destroy

      scope :with_granted_access,                  -> { where_assoc_exists(:subscriptions, status: Subscription::ACCESS_GRANTING_STATUSES) }
      scope :with_subscription,                    -> { where_assoc_exists(:subscriptions) }
      scope :with_active_subscription,             -> { where_assoc_exists(:subscriptions, status: :active) }
      scope :with_canceled_subscription,           -> { where_assoc_exists(:subscriptions, status: :canceled) }
      scope :with_incomplete_expired_subscription, -> { where_assoc_exists(:subscriptions, status: :incomplete_expired) }
      scope :with_many_subscriptions,              -> { where_assoc_count(1, :<, :subscriptions) }
      scope :with_one_subscription,                -> { where_assoc_count(1, :==, :subscriptions) }
      scope :subscribed_or_trialing,               -> { with_granted_access }

      before_validation :set_trial_ends_at, on: :create
    end

    # @param [Subscription] sub
    def assign_subscription_attributes(sub)
      self.subscription_id = sub.id
      self.subscription_status = sub.status
      self.processor_plan_name = sub.plan_nickname
      self.processor_plan_id = sub.plan_id

      assign_max_active_users(sub)
      assign_max_storage_size_in_bytes(sub)
    end

    def assign_max_active_users(sub)
      return if sub.max_active_users.to_i <= max_active_users.to_i

      self.max_active_users = sub.max_active_users.to_i
    end

    def assign_max_storage_size_in_bytes(sub)
      return if sub.max_storage_size_in_bytes.to_i <= max_storage_size_in_bytes.to_i

      self.max_storage_size_in_bytes = sub.max_storage_size_in_bytes.to_i
    end

    def subscription_status
      subscription&.status || super
    end

    def current_subscription
      last_subscription
    end

    def last_subscription
      subscriptions&.order(id: :asc)&.last
    end

    def last_active_subscription
      subscriptions.actives.order(id: :asc).last
    end

    def additional_subscriptions
      subscriptions.where.not(id: subscription_id)
    end

    # def max_active_users
    #   subscription&.max_active_users&.to_i || super
    # end
    #
    # def max_storage_size_in_bytes
    #   subscription&.max_storage_size_in_bytes&.to_i || super
    # end

    def processor_plan_name
      subscription&.plan_nickname || super
    end

    def processor_plan_id
      subscription&.plan_id || super
    end

    def access_granted?
      return true if free? || trial_period?
      return false if suspended? || subscription_id.blank?

      subscription.access_granted?
    end

    def cancel_requested?
      return false if subscription_id.blank?

      subscription.active? && subscription.cancel_at_period_end?
    end

    def enabled?
      access_granted?
    end

    def action_required?
      subscription.present? && subscription.incomplete?
    end

    def disabled?
      !enabled?
    end

    def remove_free_access
      restart_trial_period
      save!
    end

    def sync_subscriptions!
      ::Stripe::Subscription.list({ customer: processor_customer_id }).auto_paging_each do |stripe_subscription|
        sub = subscriptions.find_or_initialize_by(processor_id: stripe_subscription.id)
        sub.sync!(stripe_subscription)

        if sub.plan_primary?
          assign_subscription_attributes(sub)
          save!
        end

        sub.sync_invoices!
      end
    end

    def trial_period?
      return false if trial_ends_at.blank?

      (subscription_id.blank? || !subscription.access_granted?) && trial_ends_at >= Date.current
    end

    def trial_expired?
      return false if trial_ends_at.blank?

      subscription_id.blank? && trial_ends_at < Date.current
    end

    def trial_period_in_days
      return 0 if trial_ends_at.blank? || trial_expired?

      (trial_ends_at - Date.current).to_i
    end

    def default_trial_days
      (referral_code_trial_days || 30)
    end

    def referral_code_trial_days
      referral_code&.trial_days.presence
    end

    def default_personal_trial_days
      14.days
    end

    def subscription_access_granted?
      return false if subscription.blank?

      subscription.access_granted?
    end

    def subscription_active?
      return false if subscription.blank?

      subscription.active?
    end

    def subscription_incomplete?
      return false if subscription.blank?

      subscription.incomplete?
    end

    def subscription_incomplete_expired?
      return false if subscription.blank?

      subscription.incomplete_expired?
    end

    def subscription_past_due?
      return false if subscription.blank?

      subscription.past_due?
    end

    def subscription_unpaid?
      return false if subscription.blank?

      subscription.unpaid?
    end

    def subscription_canceled?
      return false if subscription.blank?

      subscription.canceled?
    end

    def subscription_cancellation_requested?
      return false if subscription.blank?

      subscription.active? && subscription.cancel_at_period_end?
    end

    def last_payment_failed?
      return false if subscription.blank?

      last_subscription_charge&.failed?
    end

    def last_subscription_charge
      subscription.subscription_charges.last
    end

    def free_or_active?
      free? || (subscription_active? && !subscription_cancellation_requested?)
    end

    def subscription_past_due_and_last_invoice_open?
      return false if subscription.blank?

      subscription.past_due? && last_invoice_open?
    end

    def subscribed?
      return false if subscription.blank? || subscription.incomplete_expired? || subscription.canceled?

      true
    end

    def force_subscription?
      incomplete? &&
        subscription_id.blank? &&
        referral_code.present? &&
        default_trial_days.zero?
    end

    def use_coupon?
      incomplete? &&
        referral_code.present? &&
        referral_code.discount? &&
        referral_code.benefit.positive?
    end

    protected

    def set_trial_ends_at
      return if personal? && free?
      return if default_trial_days.zero?

      self.free  = false
      self.trial = true
      self.subscription_status = :incomplete
      self.trial_ends_at = Date.current + default_trial_days.days
    end

    def restart_trial_period
      self.trial_ends_at ||= (Date.current + default_personal_trial_days.days)
      self.free = false
      self.trial = true
      self.subscription_status = :incomplete
    end

    def last_invoice_open?
      return false if subscription.blank?

      subscription.subscription_invoices.last&.open?
    end
  end
end
