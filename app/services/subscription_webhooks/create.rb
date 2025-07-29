# frozen_string_literal: true

module SubscriptionWebhooks
  class Create < ApplicationService
    def call
      event_type = context.event.type
      event      = context.event.to_hash

      context.subscription_webhook = SubscriptionWebhook.new(event_type:, event:)
      return dispatch_event if context.subscription_webhook.save

      add_fail_message(context.subscription_webhook)
    end

    private

    def dispatch_event; end
  end
end
