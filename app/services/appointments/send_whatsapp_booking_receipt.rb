# frozen_string_literal: true

module Appointments
  class SendWhatsappBookingReceipt < ApplicationService
    include NotificationHelpers

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment is required') unless appointment
      return unless appointment.whatsapp_number.present?

      message = build_message(appointment)
      account  = appointment.account

      result = send_whatsapp(account: account, phone: appointment.whatsapp_number, message: message)

      if result[:success]
        context.sent     = true
        context.sent_via = 'api'
      else
        context.whatsapp_link = whatsapp_link(phone: appointment.whatsapp_number, message: message)
        context.sent  = false
        context.error = result[:error]
      end

      context.message = message
    end

    private

    def build_message(appointment)
      professional_name = appointment.account_user&.user&.first_name || 'Profissional'
      service_name      = appointment.service.name
      start_time        = format_time(appointment.start_time)
      company_name      = appointment.account&.company&.name.presence ||
                          appointment.account&.company&.first_name.presence ||
                          'nossa equipe'

      msg = "📋 *Agendamento Recebido!*\n\n"
      msg += "Olá! Seu agendamento foi realizado com sucesso:\n\n"
      msg += "📅 *Data:* #{start_time}\n"
      msg += "👤 *Profissional:* #{professional_name}\n"
      msg += "💼 *Serviço:* #{service_name}\n"
      msg += "\n⏳ Aguardando confirmação de #{company_name}."

      if appointment.google_meet_link.present?
        msg += "\n\n🔗 *Link da reunião:* #{appointment.google_meet_link}"
      end

      if appointment.manage_url.present?
        hours = (appointment.appointment_link&.settings&.dig('cancel_reschedule_hours')&.to_i || 24).clamp(1, 720)
        msg += "\n\n⚙️ *Gerenciar agendamento* (cancele ou reagende até #{hours}h antes):\n#{appointment.manage_url}"
      end

      msg += "\n\nObrigado pela preferência! 🙏"
      msg
    end
  end
end
