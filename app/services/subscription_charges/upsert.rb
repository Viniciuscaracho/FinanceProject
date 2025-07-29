# frozen_string_literal: true

module SubscriptionCharges
  class Upsert < ApplicationService
    def call
      account = context.account
      subscription = context.subscription
      subscription_invoice = context.subscription_invoice
      stripe_charge = context.stripe_charge
      processor_id = stripe_charge.id

      SubscriptionCharge.with_advisory_lock("subscription_charge:#{processor_id}:upsert") do
        context.subscription_charge = account.subscription_charges.find_or_initialize_by(
          subscription:,
          subscription_invoice:,
          processor_id:
        )
        return dispatch_event if context.subscription_charge.sync!(stripe_charge)
      end

      add_fail_message(context.subscription_charge)
    end

    def dispatch_event
      # EventModelDispatcher.call(model: context.subscription_webhook, event: SubscriptionWebhooks::SubscriptionWebhookCreated)
    end
  end
end
