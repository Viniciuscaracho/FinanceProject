# frozen_string_literal: true

# Enviada quando o agendamento já passou e o pagamento ainda está pendente.
module Appointments
  class SendOverdueNotification < ApplicationService
    include NotificationHelpers

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment required')    unless appointment
      return context.fail!(error: 'Already sent')            if appointment.overdue_notification_sent?
      return context.fail!(error: 'Payment already settled') if appointment.payment_status == :paid
      return context.fail!(error: 'Not past yet')            if appointment.start_time > Time.current

      message = build_message(appointment)
      result  = send_whatsapp(account: appointment.account, phone: appointment.whatsapp_number, message: message)

      if result[:success]
        appointment.update!(overdue_notification_sent: true, overdue_notification_sent_at: Time.current)
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
      lines << "⚠️ *Pagamento em Atraso*"
      lines << ""
      lines << "Olá! Identificamos que o pagamento do seu atendimento ainda não foi realizado."
      lines << ""
      lines << "📅 *Atendimento:* #{format_time(appointment.start_time)}"
      lines << "💼 *Serviço:* #{appointment.service.name}"
      lines << "💰 *Valor:* #{price_formatted(appointment)}"

      if pix_key(appointment).present?
        lines << ""
        lines << "💳 *Regularize via PIX:*"
        lines << "🔑 Chave: #{pix_key(appointment)}"
      end

      lines << ""
      lines << "Por favor, efetue o pagamento o quanto antes. Obrigado! 🙏"
      lines.join("\n")
    end
  end
end
