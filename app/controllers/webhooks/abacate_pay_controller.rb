# frozen_string_literal: true

module Webhooks
  class AbacatePayController < Webhooks::ApplicationController
    def create
      payload = JSON.parse(request.body.read)
      event_type = payload['event'] || payload['type']
      billing_data = payload['billing'] || payload.dig('data', 'billing') || payload

      BarberManagement::AbacatePay::HandleWebhook.call(
        event: billing_data,
        event_type: event_type
      )

      head :ok
    rescue JSON::ParserError => e
      Rails.logger.error "AbacatePay webhook: JSON inválido — #{e.message}"
      head :bad_request
    rescue StandardError => e
      Rails.logger.error "AbacatePay webhook: erro — #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      head :internal_server_error
    end
  end
end
