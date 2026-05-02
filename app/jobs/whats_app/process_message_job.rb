# frozen_string_literal: true

module WhatsApp
  class ProcessMessageJob < ApplicationJob
    queue_as :default

    def perform(account_id:, message:, whatsapp_number:)
      account = Account.find(account_id)
      
      # Parsear mensagem
      parser = MessageParser.new(message: message, account: account)
      parsed_data = parser.parse
      
      Rails.logger.info "WhatsApp Message Parsed: #{parsed_data.inspect}"
      
      # Processar baseado no intent
      case parsed_data[:intent]
      when :schedule
        create_appointment(account, parsed_data, whatsapp_number)
      when :list_services
        send_services_list(account, whatsapp_number)
      when :query
        send_query_response(account, parsed_data, whatsapp_number)
      else
        send_default_response(account, whatsapp_number)
      end
    rescue StandardError => e
      Rails.logger.error "Error processing WhatsApp message: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      
      # Enviar mensagem de erro ao cliente
      send_error_message(account, whatsapp_number, e.message)
    end

    private

    def create_appointment(account, parsed_data, whatsapp_number)
      creator = AppointmentCreator.new(
        account: account,
        parsed_data: parsed_data,
        whatsapp_number: whatsapp_number
      )
      
      result = creator.create
      
      # Enviar resposta via WhatsApp (simulado)
      response = ResponseBuilder.new(
        intent: :schedule,
        account: account,
        parsed_data: parsed_data,
        result: result
      ).build
      
      send_whatsapp_message(account, whatsapp_number, response)
      
      result
    end

    def send_services_list(account, whatsapp_number)
      response = ResponseBuilder.new(
        intent: :list_services,
        account: account
      ).build
      
      send_whatsapp_message(account, whatsapp_number, response)
    end

    def send_query_response(account, parsed_data, whatsapp_number)
      response = ResponseBuilder.new(
        intent: :query,
        account: account,
        parsed_data: parsed_data
      ).build
      
      send_whatsapp_message(account, whatsapp_number, response)
    end

    def send_default_response(account, whatsapp_number)
      response = ResponseBuilder.new(
        intent: :unknown,
        account: account
      ).build
      
      send_whatsapp_message(account, whatsapp_number, response)
    end

    def send_error_message(account, whatsapp_number, error)
      message = "❌ Desculpe, ocorreu um erro ao processar sua mensagem.\n\n" \
                "Por favor, tente novamente ou entre em contato conosco."
      
      send_whatsapp_message(account, whatsapp_number, message)
    end

    def send_whatsapp_message(account, whatsapp_number, message)
      # Verificar se Evolution API está configurada para esta conta
      if WhatsApp::EvolutionApiClient.configured?(account: account)
        result = WhatsApp::EvolutionApiClient.send_message(
          account: account,
          phone: whatsapp_number,
          message: message
        )
        
        if result[:success]
          Rails.logger.info "✅ WhatsApp message sent to #{whatsapp_number} (Account: #{account.id})"
          true
        else
          Rails.logger.error "❌ Failed to send WhatsApp message (Account: #{account.id}): #{result[:error]}"
          # Fallback: criar link do WhatsApp Web se a API falhar
          create_fallback_link(whatsapp_number, message)
          false
        end
      else
        # Se não estiver configurada para esta conta, criar link do WhatsApp Web como fallback
        Rails.logger.warn "⚠️ Evolution API não configurada para Account #{account.id}. Usando link do WhatsApp Web como fallback."
        create_fallback_link(whatsapp_number, message)
        true
      end
    end

    def create_fallback_link(whatsapp_number, message)
      # Normalizar número
      normalized_phone = whatsapp_number.to_s.gsub(/\D/, '')
      normalized_phone = "55#{normalized_phone}" unless normalized_phone.start_with?('55')
      
      encoded_message = ERB::Util.url_encode(message)
      whatsapp_link = "https://wa.me/#{normalized_phone}?text=#{encoded_message}"
      
      Rails.logger.info "📱 WhatsApp Web Link: #{whatsapp_link}"
      whatsapp_link
    end
  end
end

