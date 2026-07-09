# frozen_string_literal: true

module Coaching
  class FeedbackDraftService
    ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
    MODEL         = 'claude-haiku-4-5-20251001'

    def initialize(contact, last_event)
      @contact    = contact
      @last_event = last_event
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

      response.parsed_response.dig('content', 0, 'text').to_s.strip
    rescue => e
      Rails.logger.error "[Coaching::FeedbackDraftService] #{e.class}: #{e.message}"
      "Não foi possível gerar o rascunho no momento."
    end

    private

    def prompt
      <<~PROMPT
        Você é um assistente de coaching esportivo. Escreva um rascunho de feedback motivador e direto para o atleta,
        com base nos dados da última sessão. Tom: positivo, encorajador, prático.

        Atleta: #{@contact.name}
        Data da sessão: #{@last_event.created_at.strftime('%d/%m/%Y')}
        Sono: #{@last_event.sono || 'não informado'}
        Carga: #{@last_event.carga || 'não informada'}
        Observações: #{@last_event.observacao || 'nenhuma'}
        Próxima ação: #{@last_event.proxima_acao || 'nenhuma'}

        Rascunho de feedback para o atleta:
      PROMPT
    end
  end
end
