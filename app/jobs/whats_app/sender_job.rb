# frozen_string_literal: true

module WhatsApp
  class SenderJob < ApplicationJob
    queue_as :default

    def perform(message_id)
      message = WhatsappMessage.find_by(id: message_id)
      return unless message&.status == 'pending'

      unless WhatsApp::StateValidator.valid?(message.event_type, message.reference)
        message.mark_skipped!("Estado do recurso inválido no momento do envio")
        return
      end

      phone = message.contact.cell_phone_number
      result = WhatsApp::EvolutionApiClient.send_message(
        account: message.account,
        phone:   phone,
        message: message.body
      )

      if result[:success]
        message.mark_sent!(external_id: result.dig(:response, 'key', 'id'))
      else
        message.mark_failed!(result[:error])
        Rails.logger.error "[WhatsApp::SenderJob] Falha ao enviar mensagem #{message_id}: #{result[:error]}"
      end
    end
  end
end
