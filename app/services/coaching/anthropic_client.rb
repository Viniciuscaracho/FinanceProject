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

    def complete(prompt:, max_tokens: 1024)
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

      response.parsed_response.dig('content', 0, 'text').presence
    rescue StandardError => e
      Rails.logger.error "#{@tag} #{e.class}: #{e.message}"
      nil
    end
  end
end
