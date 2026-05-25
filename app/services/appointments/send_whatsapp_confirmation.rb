# frozen_string_literal: true

module Appointments
  class SendWhatsappConfirmation < ApplicationService
    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment is required') unless appointment

      message = build_confirmation_message(appointment)
      account = appointment.account

      send_result = send_whatsapp_message(account: account, phone: appointment.whatsapp_number, message: message)

      if send_result[:success]
        context.sent = true
        context.sent_via = send_result[:via] || 'api'
      else
        whatsapp_link = create_whatsapp_link(phone: appointment.whatsapp_number, message: message)
        context.whatsapp_link = whatsapp_link
        context.sent = false
        context.error = send_result[:error]
      end

      context.message = message
    end

    private

    def build_confirmation_message(appointment)
      client_name = appointment.contact&.first_name || 'Cliente'
      professional_name = appointment.account_user&.user&.first_name || 'Profissional'
      service_name = appointment.service.name
      start_time = appointment.start_time.strftime('%d/%m/%Y às %H:%M')

      message = "✅ *Agendamento Confirmado!*\n\n"
      message += "Olá, #{client_name}! Seu *#{service_name}* com #{professional_name} está confirmado para #{start_time}."

      if appointment.google_meet_link.present?
        message += "\n\n🔗 *Link da reunião:* #{appointment.google_meet_link}"
      end

      if appointment.manage_url.present?
        message += "\n\n📲 *Precisa reagendar ou cancelar?*\n#{appointment.manage_url}"
      end

      message
    end

    def send_whatsapp_message(account:, phone:, message:)
      if WhatsApp::EvolutionApiClient.configured?(account: account)
        result = WhatsApp::EvolutionApiClient.send_message(account: account, phone: phone, message: message)
        if result[:success]
          { success: true, via: 'api' }
        else
          { success: false, error: result[:error], via: 'api' }
        end
      else
        { success: false, error: 'API não configurada para esta conta', via: 'link' }
      end
    end

    def create_whatsapp_link(phone:, message:)
      normalized = phone.gsub(/\D/, '')
      normalized = "55#{normalized}" unless normalized.start_with?('55')
      "https://wa.me/#{normalized}?text=#{ERB::Util.url_encode(message)}"
    end
  end
end
