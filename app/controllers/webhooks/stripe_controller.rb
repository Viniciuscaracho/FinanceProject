# frozen_string_literal: true

module Webhooks
  class StripeController < Webhooks::ApplicationController
    def create
      event = Stripe::Webhook.construct_event(request.body.read, sig_header, endpoint_secret)
      result = SubscriptionWebhooks::Create.call(event:)
      return head :ok if result.success?

      head :bad_request
    rescue StandardError => e
      Rails.logger.error("Stripe webhooks error: #{e.message}")
      head :bad_request
    end

    private

    def endpoint_secret
      Rails.application.credentials.dig(:stripe, :webhook_secret)
    end

    def sig_header
      request.env.fetch('HTTP_STRIPE_SIGNATURE')
    end
  end
end
