# frozen_string_literal: true

module Subscriptions
  class Upsert < ApplicationService
    def call
      processor_id = context.stripe_subscription.id
      Subscription.with_advisory_lock("subscription:#{processor_id}:upsert") do
        context.subscription = context.account.subscriptions.find_or_initialize_by(processor_id:)
        return if context.subscription.sync!(context.stripe_subscription)
      end

      add_fail_message(context.subscription)
    end
  end
end
