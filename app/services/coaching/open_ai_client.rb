# frozen_string_literal: true

module Coaching
  # Shared OpenAI Chat Completions client used by all coaching services.
  #
  # Returns the response text (String) on success.
  # Returns nil when: non-2xx response, network error, or blank response text.
  # Never raises — callers decide their own fallback.
  class OpenAiClient
    URL          = 'https://api.openai.com/v1/chat/completions'
    MODEL        = 'gpt-4o-mini'
    OPEN_TIMEOUT = 5
    READ_TIMEOUT = 30

    def initialize(caller_tag = 'OpenAiClient')
      @tag = "[Coaching::#{caller_tag}]"
    end

    def complete(prompt:, max_tokens: 1024, account_id: nil, contact_id: nil)
      Rails.logger.warn "#{@tag} OPENAI_API_KEY not set" if ENV['OPENAI_API_KEY'].blank?

      response = HTTParty.post(
        URL,
        timeout:      READ_TIMEOUT,
        open_timeout: OPEN_TIMEOUT,
        headers: {
          'Authorization' => "Bearer #{ENV['OPENAI_API_KEY']}",
          'Content-Type'  => 'application/json'
        },
        body: {
          model:      MODEL,
          max_tokens: max_tokens,
          messages:   [{ role: 'user', content: prompt }]
        }.to_json
      )

      unless response.success?
        Rails.logger.error "#{@tag} OpenAI #{response.code}: #{response.body.to_s.truncate(200)}"
        return nil
      end

      record_token_usage(response.parsed_response, account_id, contact_id)

      response.parsed_response.dig('choices', 0, 'message', 'content').presence
    rescue StandardError => e
      Rails.logger.error "#{@tag} #{e.class}: #{e.message}"
      nil
    end

    private

    def record_token_usage(parsed, account_id, contact_id)
      usage = parsed.is_a?(Hash) ? parsed['usage'] : nil
      return if usage.blank?

      AiTokenUsage.create!(
        account_id:    account_id || resolved_account_id,
        contact_id:    contact_id,
        service:       @tag.gsub(/\A\[Coaching::|\]\z/, ''),
        model:         parsed['model'].presence || MODEL,
        input_tokens:  usage['prompt_tokens'].to_i,
        output_tokens: usage['completion_tokens'].to_i
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
