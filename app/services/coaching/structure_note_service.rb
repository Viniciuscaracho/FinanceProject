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

        Campos principais:
        - sono: qualidade/duração do sono mencionada (string curta ou null)
        - carga: intensidade, volume ou carga de treino em geral (string curta ou null)
        - observacao: observações clínicas, comportamentais ou sobre sensações físicas relevantes (texto livre ou null)
        - proxima_acao: próxima ação ou recomendação mencionada (texto livre ou null)

        Campo extras (objeto JSON com campos opcionais — inclua apenas os mencionados):
        - modalidade: lista de modalidades/esportes praticados (array de strings, ex: ["musculação", "boxe"])
        - divisao_treino: resumo da divisão semanal como objeto {seg, ter, qua, qui, sex, sab, dom} com o que é feito cada dia (null dias não mencionados)
        - exercicios: lista de exercícios mencionados (array de strings)
        - volume: informação sobre séries, repetições ou duração (string curta, ex: "2 séries de trabalho")
        - metodo: método ou abordagem de treino destacada (string, ex: "treino funcional", "peso conservador")

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
      { sono: nil, carga: nil, observacao: @raw_input, proxima_acao: nil, extras: nil }
    end
  end
end
