# frozen_string_literal: true

# Enviada quando um agendamento confirmado ainda tem pagamento pendente.
# Dispara logo após a confirmação (ou no próximo ciclo do job).
module Appointments
  class SendBillingNotification < ApplicationService
    include NotificationHelpers

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment required')       unless appointment
      return context.fail!(error: 'Already sent')               if appointment.billing_notification_sent?
      return context.fail!(error: 'Not confirmed')              unless appointment.status == :confirmed
      return context.fail!(error: 'Payment already settled')    if appointment.payment_status == :paid

      message = build_message(appointment)
      result  = send_whatsapp(account: appointment.account, phone: appointment.whatsapp_number, message: message)

      if result[:success]
        appointment.update!(billing_notification_sent: true, billing_notification_sent_at: Time.current)
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
      lines << "📋 *Cobrança Pendente*"
      lines << ""
      lines << "Olá! Identificamos que o pagamento do seu agendamento ainda está pendente."
      lines << ""
      lines << "📅 *Agendamento:* #{format_time(appointment.start_time)}"
      lines << "💼 *Serviço:* #{appointment.service.name}"
      lines << "💰 *Valor:* #{price_formatted(appointment)}"

      if pix_key(appointment).present?
        lines << ""
        lines << "💳 *Pague via PIX:*"
        lines << "🔑 Chave: #{pix_key(appointment)}"
      end

      if appointment.google_meet_link.present?
        lines << ""
        lines << "🔗 *Link da reunião:* #{appointment.google_meet_link}"
      end

      lines << ""
      lines << "Qualquer dúvida, estamos à disposição. 😊"
      lines.join("\n")
    end
  end
end
