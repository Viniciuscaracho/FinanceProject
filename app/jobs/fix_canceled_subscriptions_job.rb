# frozen_string_literal: true

class FixCanceledSubscriptionsJob < ApplicationJob
  queue_as :default

  def perform
    Stripe::Subscription.list({ status: 'canceled' }).auto_paging_each do |stripe_subscription|
      account = Account.find_by(processor_customer_id: stripe_subscription.customer)
      next if account.blank?

      subscription = account.subscriptions.find_by(processor_id: stripe_subscription.id)
      next if subscription.blank?

      subscription.sync!(stripe_subscription)
    end
    #
    # Account.with_incomplete_expired_subscription.find_each do |account|
    #   last_subscription = account.last_subscription # if there is no active subscription, get the last subscription
    #   next if last_subscription.blank?
    #   next unless last_subscription.incomplete_expired?
    #
    #   account.assign_subscription_attributes(last_subscription)
    #   account.without_auditing { account.save! }
    # end
  end
end
