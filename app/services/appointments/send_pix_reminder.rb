# frozen_string_literal: true

# Lembrete de PIX enviado 24h antes do agendamento quando pagamento ainda está pendente.
module Appointments
  class SendPixReminder < ApplicationService
    include NotificationHelpers

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment required')    unless appointment
      return context.fail!(error: 'Already sent')            if appointment.pix_reminder_sent?
      return context.fail!(error: 'Not confirmed')           unless appointment.status == :confirmed
      return context.fail!(error: 'Payment already settled') if appointment.payment_status == :paid
      return context.fail!(error: 'No PIX key configured')  unless pix_key(appointment).present?

      message = build_message(appointment)
      result  = send_whatsapp(account: appointment.account, phone: appointment.whatsapp_number, message: message)

      if result[:success]
        appointment.update!(pix_reminder_sent: true, pix_reminder_sent_at: Time.current)
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
      lines << "💳 *Lembrete de Pagamento PIX*"
      lines << ""
      lines << "Olá! Seu agendamento é amanhã e o pagamento ainda está pendente."
      lines << ""
      lines << "📅 *Data:* #{format_time(appointment.start_time)}"
      lines << "💼 *Serviço:* #{appointment.service.name}"
      lines << "💰 *Valor:* #{price_formatted(appointment)}"
      lines << ""
      lines << "🔑 *Chave PIX:* #{pix_key(appointment)}"
      lines << ""
      lines << "Realize o pagamento antes do atendimento. Até amanhã! 😊"
      lines.join("\n")
    end
  end
end
