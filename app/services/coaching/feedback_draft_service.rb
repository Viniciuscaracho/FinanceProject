# frozen_string_literal: true

module Coaching
  class FeedbackDraftService
    def initialize(contact, last_event)
      @contact    = contact
      @last_event = last_event
    end

    def call
      text = OpenAiClient.new('FeedbackDraftService').complete(prompt: prompt, max_tokens: 512)
      text || 'Não foi possível gerar o rascunho no momento.'
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
