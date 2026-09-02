# frozen_string_literal: true

module Coaching
  # Analisa a transcrição de um áudio do treinador e extrai contexto rico:
  # nome do atleta, campos de coaching (sono/carga/observacao/proxima_acao),
  # objetivo de médio prazo e prazo de reavaliação.
  class ParseAudioContextService
    def initialize(transcript)
      @transcript = transcript
    end

    def call
      text = OpenAiClient.new('ParseAudioContextService').complete(prompt: prompt, max_tokens: 512)
      return fallback if text.nil?

      clean = text.gsub(/\A```(?:json)?\s*/, '').gsub(/\s*```\z/, '').strip
      JSON.parse(clean).symbolize_keys
    rescue JSON::ParserError => e
      Rails.logger.error "[Coaching::ParseAudioContextService] JSON::ParserError: #{e.message}"
      fallback
    rescue => e
      Rails.logger.error "[Coaching::ParseAudioContextService] #{e.class}: #{e.message}"
      fallback
    end

    private

    def prompt
      <<~PROMPT
        Você é um assistente de coaching esportivo. Analise a transcrição abaixo e extraia as informações em JSON.
        Responda APENAS com o JSON, sem explicações adicionais.

        Campos principais:
        - athlete_name: nome completo do atleta mencionado (string ou null). null quando é o próprio treinador falando de si.
        - is_self: true se o treinador está relatando seu próprio treino, performance ou saúde (sem mencionar outro atleta). false ou null caso contrário.
        - sono: qualidade ou duração do sono mencionada (string curta ou null)
        - carga: intensidade, volume ou carga de treino em geral (string curta ou null)
        - observacao: observações clínicas, comportamentais ou sobre sensações físicas relevantes (texto livre ou null)
        - proxima_acao: próxima ação ou ajuste imediato de treino (texto livre ou null)
        - goal: objetivo de médio ou longo prazo do atleta (texto livre ou null)
        - days_to_reassessment: número inteiro de dias até a próxima reavaliação (integer ou null)

        Regras para days_to_reassessment:
        - "em 15 dias" → 15, "em 2 semanas" → 14, "mês que vem" → 30, "em 3 semanas" → 21, não mencionado → null

        Campo extras (objeto JSON com campos opcionais — inclua apenas os mencionados):
        - modalidade: lista de modalidades/esportes praticados (array de strings, ex: ["musculação", "boxe"])
        - divisao_treino: resumo da divisão semanal como objeto {seg, ter, qua, qui, sex, sab, dom} com o que é feito cada dia (null dias não mencionados)
        - exercicios: lista de exercícios mencionados (array de strings)
        - volume: informação sobre séries, repetições ou duração (string curta, ex: "2 séries de trabalho")
        - metodo: método ou abordagem de treino destacada (string, ex: "treino funcional", "peso conservador para prevenção de lesão")

        Transcrição:
        #{@transcript}

        JSON:
      PROMPT
    end

    def fallback
      {
        athlete_name:         nil,
        is_self:              nil,
        sono:                 nil,
        carga:                nil,
        observacao:           @transcript,
        proxima_acao:         nil,
        goal:                 nil,
        days_to_reassessment: nil,
        extras:               nil
      }
    end
  end
end
