# frozen_string_literal: true

module Webhooks
  class StripeController < Webhooks::ApplicationController
    def create
      event = Stripe::Webhook.construct_event(request.body.read, sig_header, endpoint_secret)
      
      # Primeiro, tentar processar com o handler dedicado do BarberManagement
      barber_management_result = BarberManagement::Stripe::WebhookHandler.call(event: event)
      if barber_management_result.success?
        return head :ok
      end

      # Se não for do BarberManagement, processar eventos de assinatura genéricos
      result = SubscriptionWebhooks::Create.call(event:)
      return head :ok if result.success?

      # Processar eventos de pagamento de agendamentos
      AppointmentWebhooks::ProcessPayment.call(event: event)
      
      head :ok
    rescue StandardError => e
      Rails.logger.error("Stripe webhooks error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      head :bad_request
    end

    private

    def endpoint_secret
      # Prioridade: barber_management > stripe (para compatibilidade)
      Rails.application.credentials.dig(:barber_management, :stripe, :webhook_secret) ||
        Rails.application.credentials.dig(:stripe, :webhook_secret)
    end

    def sig_header
      request.env.fetch('HTTP_STRIPE_SIGNATURE')
    end
  end
end
