
module Accounts
  # This subscriber is responsible for updating the bank account balance when a transaction is created.
  class AssignAttributesSubscriber < ApplicationSubscriber
    on_publish :subscription_upserted

    def on_subscription_upserted(event)
      subscription = event.payload.fetch(:record)
      return if subscription.blank?

      account = Account.find(subscription.account_id)
      return if account.blank?

      Account.with_advisory_lock("account:#{account.id}:assign_subscription_attributes") do
        account.assign_subscription_attributes(subscription)
        account.without_auditing { account.save! }
      end
    end
  end
end