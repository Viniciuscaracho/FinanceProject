# frozen_string_literal: true

module BarberManagement
  module AbacatePay
    class Client
      BASE_URL = 'https://api.abacatepay.com/v2'

      class << self
        def api_key
          Rails.application.credentials.dig(:barber_management, :abacate_pay, :api_key) ||
            ENV['ABACATE_PAY_API_KEY']
        end

        def webhook_token
          Rails.application.credentials.dig(:barber_management, :abacate_pay, :webhook_token) ||
            ENV['ABACATE_PAY_WEBHOOK_TOKEN']
        end

        def configured?
          api_key.present?
        end

        def post(path, body:)
          response = HTTParty.post(
            "#{BASE_URL}#{path}",
            headers: default_headers,
            body: body.to_json
          )
          handle_response(response)
        end

        def get(path, query: {})
          response = HTTParty.get(
            "#{BASE_URL}#{path}",
            headers: default_headers,
            query: query.presence
          )
          handle_response(response)
        end

        private

        def default_headers
          {
            'Authorization' => "Bearer #{api_key}",
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
          }
        end

        def handle_response(response)
          parsed = response.parsed_response

          if parsed.is_a?(Hash) && parsed['success'] == false
            error_msg = parsed['error'] || 'Erro desconhecido'
            raise AbacatePayError, "AbacatePay: #{error_msg}"
          end

          if response.success?
            parsed.is_a?(Hash) ? (parsed['data'] || parsed) : parsed
          else
            error_msg = parsed.is_a?(Hash) ? (parsed['error'] || response.message) : response.message
            raise AbacatePayError, "AbacatePay API error (#{response.code}): #{error_msg}"
          end
        end
      end
    end

    class AbacatePayError < StandardError; end
  end
end
