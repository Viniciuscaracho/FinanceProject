# frozen_string_literal: true

module BarberManagement
  module Stripe
    # Cliente Stripe dedicado para o BarberManagement
    # Garante que todas as operações sejam identificadas com metadata específica
    class Client
      class << self
        def api_key
          ENV['STRIPE_API_KEY'] ||
            Rails.application.credentials.dig(:orbi, :stripe, :api_key) ||
            Rails.application.credentials.dig(:stripe, :private_key)
        end

        def webhook_secret
          ENV['STRIPE_WEBHOOK_SECRET'] ||
            Rails.application.credentials.dig(:orbi, :stripe, :webhook_secret) ||
            Rails.application.credentials.dig(:stripe, :webhook_secret)
        end

        def configured?
          api_key.present?
        end

        # Executa uma operação Stripe com a API key específica do BarberManagement
        def with_api_key(&block)
          original_key = ::Stripe.api_key
          ::Stripe.api_key = api_key
          result = yield
          ::Stripe.api_key = original_key
          result
        rescue StandardError => e
          ::Stripe.api_key = original_key
          raise e
        end

        # Metadata padrão para identificar operações do BarberManagement
        def default_metadata(account_id: nil, user_id: nil, additional: {})
          {
            source: 'barber_management',
            project: 'BarberManagement',
            version: '1.0',
            account_id: account_id&.to_s,
            user_id: user_id&.to_s,
            timestamp: Time.current.iso8601
          }.merge(additional).compact
        end
      end
    end
  end
end

