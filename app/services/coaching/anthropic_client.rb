# frozen_string_literal: true

module Coaching
  # Shared Anthropic API client used by all coaching services.
  #
  # Returns the response text (String) on success.
  # Returns nil when: non-2xx response, network error, or blank response text.
  # Never raises — callers decide their own fallback.
  class AnthropicClient
    URL          = 'https://api.anthropic.com/v1/messages'
    MODEL        = 'claude-haiku-4-5-20251001'
    OPEN_TIMEOUT = 5   # seconds to open TCP connection
    READ_TIMEOUT = 30  # seconds to wait for full response

    def initialize(caller_tag = 'AnthropicClient')
      @tag = "[Coaching::#{caller_tag}]"
    end

    # account_id/contact_id são opcionais: quando não informados, o registro de
    # uso tenta inferir a conta a partir do contexto (Current.account ou o tenant
    # ativo no ActsAsTenant, útil nos jobs de WhatsApp).
    def complete(prompt:, max_tokens: 1024, account_id: nil, contact_id: nil)
      Rails.logger.warn "#{@tag} ANTHROPIC_API_KEY not set" if ENV['ANTHROPIC_API_KEY'].blank?

      response = HTTParty.post(
        URL,
        timeout:      READ_TIMEOUT,
        open_timeout: OPEN_TIMEOUT,
        headers: {
          'x-api-key'         => ENV['ANTHROPIC_API_KEY'],
          'anthropic-version' => '2023-06-01',
          'content-type'      => 'application/json'
        },
        body: {
          model:      MODEL,
          max_tokens: max_tokens,
          messages:   [{ role: 'user', content: prompt }]
        }.to_json
      )

      unless response.success?
        Rails.logger.error "#{@tag} Anthropic #{response.code}: #{response.body.to_s.truncate(200)}"
        return nil
      end

      record_token_usage(response.parsed_response, account_id, contact_id)

      response.parsed_response.dig('content', 0, 'text').presence
    rescue StandardError => e
      Rails.logger.error "#{@tag} #{e.class}: #{e.message}"
      nil
    end

    private

    # Grava o consumo de tokens da resposta. Nunca deixa uma falha de gravação
    # quebrar a chamada de IA — a observabilidade é secundária ao fluxo.
    def record_token_usage(parsed, account_id, contact_id)
      usage = parsed.is_a?(Hash) ? parsed['usage'] : nil
      return if usage.blank?

      AiTokenUsage.create!(
        account_id:    account_id || resolved_account_id,
        contact_id:    contact_id,
        service:       @tag.gsub(/\A\[Coaching::|\]\z/, ''),
        model:         parsed['model'].presence || MODEL,
        input_tokens:  usage['input_tokens'].to_i,
        output_tokens: usage['output_tokens'].to_i
      )
    rescue StandardError => e
      Rails.logger.error "#{@tag} falha ao registrar uso de tokens: #{e.class}: #{e.message}"
    end

    def resolved_account_id
      return Current.account.id if defined?(Current) && Current.respond_to?(:account) && Current.account

      tenant = ActsAsTenant.current_tenant if defined?(ActsAsTenant)
      tenant&.id
    end
  end
end
