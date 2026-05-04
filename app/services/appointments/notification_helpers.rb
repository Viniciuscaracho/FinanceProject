# frozen_string_literal: true

module Appointments
  module NotificationHelpers
    private

    def send_whatsapp(account:, phone:, message:)
      if WhatsApp::EvolutionApiClient.configured?(account: account)
        result = WhatsApp::EvolutionApiClient.send_message(account: account, phone: phone, message: message)
        result[:success] ? { success: true, via: 'api' } : { success: false, error: result[:error], via: 'api' }
      else
        { success: false, error: 'API não configurada', via: 'link' }
      end
    end

    def whatsapp_link(phone:, message:)
      normalized = phone.gsub(/\D/, '')
      normalized = "55#{normalized}" unless normalized.start_with?('55')
      "https://wa.me/#{normalized}?text=#{ERB::Util.url_encode(message)}"
    end

    def format_time(time)
      time.in_time_zone('America/Sao_Paulo').strftime('%d/%m/%Y às %H:%M')
    end

    def professional_name(appointment)
      appointment.account_user&.user&.first_name ||
        appointment.professional&.name ||
        "#{appointment.professional&.first_name} #{appointment.professional&.last_name}".strip
    end

    def automation_enabled?(appointment, key)
      return false unless appointment.appointment_link
      settings = appointment.appointment_link.settings || {}
      automations = settings['automations'] || {}
      automations[key.to_s] == true
    end

    def pix_key(appointment)
      return nil unless appointment.appointment_link
      settings = appointment.appointment_link.settings || {}
      automations = settings['automations'] || {}
      automations['pix_key'].presence
    end

    def price_formatted(appointment)
      amount = appointment.price_cents / 100.0
      "R$ #{format('%.2f', amount).gsub('.', ',')}"
    end
  end
end
