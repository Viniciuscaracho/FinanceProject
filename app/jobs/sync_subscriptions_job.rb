# frozen_string_literal: true

class SyncSubscriptionsJob < ApplicationJob
  queue_as :default

  def perform
    ::Stripe::Subscription.list.auto_paging_each do |stripe_subscription|
      account = Account.find_by(processor_customer_id: stripe_subscription.customer)
      next if account.blank?

      subscription = account.subscriptions.find_or_initialize_by(processor_id: stripe_subscription.id)
      ApplicationRecord.transaction do
        subscription.sync!(stripe_subscription)
        subscription.sync_invoices!

        account.assign_subscription_attributes(subscription)
        account.without_auditing { account.save! }
      end
    end
  end
end
