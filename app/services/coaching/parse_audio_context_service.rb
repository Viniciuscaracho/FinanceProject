# frozen_string_literal: true

module Coaching
  # Analisa a transcrição de um áudio do treinador e extrai contexto rico:
  # nome do atleta, campos de coaching (sono/carga/observacao/proxima_acao),
  # objetivo de médio prazo e prazo de reavaliação.
  class ParseAudioContextService
    ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
    MODEL         = 'claude-haiku-4-5-20251001'

    def initialize(transcript)
      @transcript = transcript
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
      Rails.logger.error "[Coaching::ParseAudioContextService] #{e.class}: #{e.message}"
      fallback
    end

    private

    def prompt
      <<~PROMPT
        Você é um assistente de coaching esportivo. Analise a transcrição abaixo e extraia as informações em JSON.
        Responda APENAS com o JSON, sem explicações adicionais.

        Campos:
        - athlete_name: nome completo do atleta mencionado (string ou null)
        - sono: qualidade ou duração do sono mencionada (string curta ou null)
        - carga: intensidade ou volume de treino mencionado (string curta ou null)
        - observacao: observações clínicas ou comportamentais relevantes (texto livre ou null)
        - proxima_acao: próxima ação ou ajuste imediato de treino (texto livre ou null)
        - goal: objetivo de médio ou longo prazo do atleta (texto livre ou null)
        - days_to_reassessment: número inteiro de dias até a próxima reavaliação (integer ou null)

        Regras para days_to_reassessment:
        - "em 15 dias" → 15
        - "em 2 semanas" → 14
        - "mês que vem" ou "em 1 mês" → 30
        - "em 3 semanas" → 21
        - não mencionado → null

        Transcrição do treinador:
        #{@transcript}

        JSON:
      PROMPT
    end

    def parse_response(response)
      body = response.parsed_response
      text = body.dig('content', 0, 'text').to_s.strip
      text = text.gsub(/\A```(?:json)?\s*/, '').gsub(/\s*```\z/, '').strip
      JSON.parse(text).symbolize_keys
    rescue JSON::ParserError => e
      Rails.logger.error "[Coaching::ParseAudioContextService] JSON::ParserError: #{e.message}"
      fallback
    end

    def fallback
      {
        athlete_name:         nil,
        sono:                 nil,
        carga:                nil,
        observacao:           @transcript,
        proxima_acao:         nil,
        goal:                 nil,
        days_to_reassessment: nil
      }
    end
  end
end
