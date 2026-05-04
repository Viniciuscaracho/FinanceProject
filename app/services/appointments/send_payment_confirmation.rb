# frozen_string_literal: true

# Enviada imediatamente quando payment_status muda para :paid.
module Appointments
  class SendPaymentConfirmation < ApplicationService
    include NotificationHelpers

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment required') unless appointment
      return context.fail!(error: 'Payment not settled')  unless appointment.payment_status == :paid

      message = build_message(appointment)
      result  = send_whatsapp(account: appointment.account, phone: appointment.whatsapp_number, message: message)

      if result[:success]
        context.sent = true
        context.via  = result[:via]
      else
        context.sent          = false
        context.whatsapp_link = whatsapp_link(phone: appointment.whatsapp_number, message: message)
        context.fail!(error: result[:error])
      end

      context.message = message
    end

    private

    def build_message(appointment)
      lines = []
      lines << "✅ *Pagamento Confirmado!*"
      lines << ""
      lines << "Obrigado! Recebemos o pagamento do seu agendamento."
      lines << ""
      lines << "📅 *Data:* #{format_time(appointment.start_time)}"
      lines << "💼 *Serviço:* #{appointment.service.name}"
      lines << "💰 *Valor pago:* #{price_formatted(appointment)}"

      if appointment.google_meet_link.present?
        lines << ""
        lines << "🔗 *Link da reunião:* #{appointment.google_meet_link}"
      end

      lines << ""
      lines << "Até logo! 😊"
      lines.join("\n")
    end
  end
end
