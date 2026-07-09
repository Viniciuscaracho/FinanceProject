# frozen_string_literal: true

module Coaching
  class PreVisitSummaryService
    ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
    MODEL         = 'claude-haiku-4-5-20251001'
    EVENTS_LIMIT  = 10

    def initialize(contact)
      @contact = contact
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
          max_tokens: 1024,
          messages:   [{ role: 'user', content: prompt }]
        }.to_json
      )

      response.parsed_response.dig('content', 0, 'text').to_s.strip
    rescue => e
      Rails.logger.error "[Coaching::PreVisitSummaryService] #{e.class}: #{e.message}"
      "Não foi possível gerar o resumo no momento."
    end

    private

    def prompt
      profile = @contact.coaching_profile
      recent_events = TimelineEvent
        .for_contact(@contact.id)
        .recent
        .limit(EVENTS_LIMIT)

      events_text = recent_events.map do |e|
        parts = ["[#{e.created_at.strftime('%d/%m/%Y')}]"]
        parts << "Sono: #{e.sono}" if e.sono.present?
        parts << "Carga: #{e.carga}" if e.carga.present?
        parts << "Obs: #{e.observacao}" if e.observacao.present?
        parts << "Próxima ação: #{e.proxima_acao}" if e.proxima_acao.present?
        parts.join(' | ')
      end.join("\n")

      <<~PROMPT
        Você é um assistente de coaching esportivo. Gere um resumo pré-atendimento conciso para o treinador.
        Foque nos pontos mais relevantes para a sessão de hoje.

        Atleta: #{@contact.name}
        Objetivo: #{profile&.goal || 'Não informado'}
        Limitações: #{profile&.limitations || 'Nenhuma'}

        Registros recentes (do mais novo ao mais antigo):
        #{events_text.presence || 'Nenhum registro encontrado.'}

        Resumo para o treinador:
      PROMPT
    end
  end
end
