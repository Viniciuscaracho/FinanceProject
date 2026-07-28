# frozen_string_literal: true

module Coaching
  class StructureNoteService
    def initialize(raw_input)
      @raw_input = raw_input
    end

    def call
      text = OpenAiClient.new('StructureNoteService').complete(prompt: prompt, max_tokens: 512)
      return fallback_structure if text.nil?

      parse_text(text)
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

    def parse_text(text)
      clean = text.gsub(/\A```(?:json)?\s*/, '').gsub(/\s*```\z/, '').strip
      JSON.parse(clean).symbolize_keys
    rescue JSON::ParserError => e
      Rails.logger.error "[Coaching::StructureNoteService] JSON::ParserError: #{e.message}"
      fallback_structure
    end

    def fallback_structure
      { sono: nil, carga: nil, observacao: @raw_input, proxima_acao: nil }
    end
  end
end
