# frozen_string_literal: true

module Coaching
  class StructureNoteService
    ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
    MODEL         = 'claude-haiku-4-5-20251001'

    def initialize(raw_input)
      @raw_input = raw_input
    end

    def call
      response = HTTParty.post(
        ANTHROPIC_URL,
        headers: {
          'x-api-key'         => ENV['ANTHROPIC_API_KEY'],
          'anthropic-version' => '2023-06-01',
          'content-type'      => 'application/json'
        },
        body: {
          model:      MODEL,
          max_tokens: 512,
          messages:   [{ role: 'user', content: prompt }]
        }.to_json
      )

      parse_response(response)
    rescue => e
      Rails.logger.error "[Coaching::StructureNoteService] #{e.class}: #{e.message}"
      fallback_structure
    end

    private

    def prompt
      <<~PROMPT
        Você é um assistente de coaching esportivo. Analise o texto abaixo e extraia as informações em JSON.
        Responda APENAS com o JSON, sem explicações.

        Campos:
        - sono: qualidade/duração do sono mencionada (string curta ou null)
        - carga: carga de treino mencionada (string curta ou null)
        - observacao: observações clínicas ou comportamentais relevantes (texto livre ou null)
        - proxima_acao: próxima ação ou recomendação mencionada (texto livre ou null)

        Texto do treinador:
        #{@raw_input}

        JSON:
      PROMPT
    end

    def parse_response(response)
      body = response.parsed_response
      text = body.dig('content', 0, 'text').to_s.strip
      JSON.parse(text).symbolize_keys
    rescue JSON::ParserError
      fallback_structure
    end

    def fallback_structure
      { sono: nil, carga: nil, observacao: @raw_input, proxima_acao: nil }
    end
  end
end
