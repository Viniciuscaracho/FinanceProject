# frozen_string_literal: true

module Appointments
  class SendWhatsappReminder < ApplicationService
    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment is required') unless appointment
      
      # Verificar se já foi enviado
      if appointment.whatsapp_reminder_sent?
        context.fail!(error: 'Reminder already sent')
        return
      end
      
      # Verificar se o agendamento está confirmado
      unless appointment.status == :confirmed || appointment.status == Appointment::APPOINTMENT_STATUS[:confirmed]
        context.fail!(error: 'Appointment must be confirmed')
        return
      end
      
      # Construir mensagem
      message = build_reminder_message(appointment)
      
      # Enviar via WhatsApp usando Evolution API (se configurada para esta conta)
      account = appointment.account
      send_result = send_whatsapp_message(
        account: account,
        phone: appointment.whatsapp_number,
        message: message
      )
      
      if send_result[:success]
        # Marcar como enviado apenas se o envio foi bem-sucedido
        appointment.update!(
          whatsapp_reminder_sent: true,
          whatsapp_reminder_sent_at: Time.current
        )
        context.sent = true
        context.sent_via = send_result[:via] || 'api'
      else
        # Se falhar, criar link do WhatsApp Web como fallback
        whatsapp_link = create_whatsapp_link(
          phone: appointment.whatsapp_number,
          message: message
        )
        context.whatsapp_link = whatsapp_link
        context.sent = false
        context.error = send_result[:error]
        Rails.logger.warn "⚠️ Falha ao enviar lembrete via API. Link criado: #{whatsapp_link}"
      end
      
      context.message = message
    end

    private

    def build_reminder_message(appointment)
      professional_name = appointment.professional&.name || 
                          "#{appointment.professional&.first_name} #{appointment.professional&.last_name}".strip
      service_name = appointment.service.name
      start_time = appointment.start_time.strftime('%d/%m/%Y às %H:%M')
      
      message = "🔔 Lembrete de Agendamento\n\n"
      message += "Olá! Este é um lembrete do seu agendamento:\n\n"
      message += "📅 Data: #{start_time}\n"
      message += "👤 Profissional: #{professional_name}\n"
      message += "💼 Serviço: #{service_name}\n"
      
      if appointment.google_meet_link.present?
        message += "\n🔗 Link da reunião: #{appointment.google_meet_link}\n"
      end
      
      message += "\nNos vemos em breve!"
      
      message
    end

    def send_whatsapp_message(account:, phone:, message:)
      # Verificar se Evolution API está configurada para esta conta
      if WhatsApp::EvolutionApiClient.configured?(account: account)
        result = WhatsApp::EvolutionApiClient.send_message(
          account: account,
          phone: phone,
          message: message
        )
        
        if result[:success]
          Rails.logger.info "✅ Lembrete enviado via Evolution API para #{phone} (Account: #{account.id})"
          { success: true, via: 'api' }
        else
          Rails.logger.error "❌ Erro ao enviar lembrete via API (Account: #{account.id}): #{result[:error]}"
          { success: false, error: result[:error], via: 'api' }
        end
      else
        # Se não estiver configurada para esta conta, retornar erro para criar link
        Rails.logger.warn "⚠️ Evolution API não configurada para Account #{account.id}. Usando link do WhatsApp Web."
        { success: false, error: 'API não configurada para esta conta', via: 'link' }
      end
    end

    def create_whatsapp_link(phone:, message:)
      # Normalizar número (remover caracteres não numéricos)
      normalized_phone = phone.gsub(/\D/, '')
      
      # Adicionar código do país se não tiver (assumindo Brasil)
      normalized_phone = "55#{normalized_phone}" unless normalized_phone.start_with?('55')
      
      encoded_message = ERB::Util.url_encode(message)
      "https://wa.me/#{normalized_phone}?text=#{encoded_message}"
    end
  end
end


