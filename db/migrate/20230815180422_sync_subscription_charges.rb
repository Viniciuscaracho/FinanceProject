# frozen_string_literal: true

class SyncSubscriptionCharges < ActiveRecord::Migration[7.0]
  def up
    # SyncSubscriptionsJob.perform_later
  end

  def down
    # Account.where.not(subscription_id: nil).update_all(subscription_id: nil)
    # SubscriptionCharge.delete_all
    # SubscriptionInvoice.delete_all
    # Subscription.delete_all
  end
end
