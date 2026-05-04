# frozen_string_literal: true

module Appointments
  class Send1hReminder < ApplicationService
    include NotificationHelpers

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment required') unless appointment
      return context.fail!(error: 'Already sent') if appointment.whatsapp_1h_reminder_sent?
      return context.fail!(error: 'Not confirmed') unless appointment.status == :confirmed

      message = build_message(appointment)
      result  = send_whatsapp(account: appointment.account, phone: appointment.whatsapp_number, message: message)

      if result[:success]
        appointment.update!(whatsapp_1h_reminder_sent: true, whatsapp_1h_reminder_sent_at: Time.current)
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
      lines << "⏰ *Seu encontro começa em 1 hora!*"
      lines << ""
      lines << "📅 #{format_time(appointment.start_time)}"
      lines << "👤 #{professional_name(appointment)}"
      lines << "💼 #{appointment.service.name}"

      if appointment.google_meet_link.present?
        lines << ""
        lines << "🔗 *Link da reunião:*"
        lines << appointment.google_meet_link
      end

      if pix_key(appointment).present?
        lines << ""
        lines << "💳 *Valor:* #{price_formatted(appointment)}"
        lines << "🔑 *Chave PIX:* #{pix_key(appointment)}"
      end

      lines.join("\n")
    end
  end
end
