# frozen_string_literal: true

module WhatsApp
  class EvolutionApiClient
    class << self
      # Envia uma mensagem de texto via Evolution API usando configuração da conta
      #
      # @param account [Account] Conta/empresa que possui a configuração
      # @param phone [String] Número de telefone (com ou sem formatação)
      # @param message [String] Mensagem a ser enviada
      # @param retries [Integer] Número de tentativas em caso de falha (padrão: 2)
      # @return [Hash] Resultado com :success (boolean) e :response (Hash) ou :error (String)
      def send_message(account:, phone:, message:, retries: 2)
        return error_response('Account é obrigatório') unless account.present?
        return error_response('Número de telefone é obrigatório') unless phone.present?
        return error_response('Mensagem é obrigatória') unless message.present?

        config = get_config(account)
        return error_response('Configuração WhatsApp não encontrada ou desabilitada') unless config&.configured?

        normalized_phone = normalize_phone(phone)
        base_url = config.normalized_api_url
        api_key = config.evolution_api_key
        instance = config.evolution_instance_name

        attempt = 0
        last_error = nil

        while attempt <= retries
          begin
            response = HTTParty.post(
              "#{base_url}/message/sendText/#{instance}",
              headers: {
                'Content-Type' => 'application/json',
                'apikey' => api_key
              },
              body: {
                number: normalized_phone,
                text: message
              }.to_json,
              timeout: 30
            )

            if response.success?
              Rails.logger.info "✅ WhatsApp message sent successfully to #{normalized_phone}"
              return success_response(response.parsed_response)
            else
              error_msg = response.parsed_response&.dig('message') || response.body || 'Erro desconhecido'
              last_error = "Erro ao enviar mensagem: #{error_msg} (Status: #{response.code})"
              
              # Se for erro 4xx (cliente), não tentar novamente
              if response.code >= 400 && response.code < 500
                Rails.logger.error "❌ WhatsApp API client error: #{last_error}"
                return error_response(last_error)
              end
              
              Rails.logger.warn "⚠️ WhatsApp API error (tentativa #{attempt + 1}/#{retries + 1}): #{last_error}"
            end
          rescue HTTParty::Error => e
            last_error = "Erro de conexão com API: #{e.message}"
            Rails.logger.warn "⚠️ WhatsApp HTTP error (tentativa #{attempt + 1}/#{retries + 1}): #{last_error}"
          rescue StandardError => e
            last_error = "Erro inesperado: #{e.message}"
            Rails.logger.error "❌ WhatsApp unexpected error: #{last_error}"
            Rails.logger.error e.backtrace.join("\n")
          end

          attempt += 1
          
          # Aguardar antes de tentar novamente (exponential backoff)
          if attempt <= retries
            sleep_time = 2 ** attempt # 2s, 4s, 8s...
            Rails.logger.info "⏳ Aguardando #{sleep_time}s antes de tentar novamente..."
            sleep(sleep_time)
          end
        end

        # Se chegou aqui, todas as tentativas falharam
        Rails.logger.error "❌ WhatsApp message failed after #{retries + 1} attempts: #{last_error}"
        error_response(last_error)
      end

      # Verifica se a instância está conectada
      #
      # @param account [Account] Conta/empresa que possui a configuração
      # @return [Hash] Status da conexão
      def check_connection(account:)
        return error_response('Account é obrigatório') unless account.present?

        config = get_config(account)
        return error_response('Configuração WhatsApp não encontrada ou desabilitada') unless config&.configured?

        base_url = config.normalized_api_url
        api_key = config.evolution_api_key
        instance = config.evolution_instance_name

        begin
          response = HTTParty.get(
            "#{base_url}/instance/fetchInstances",
            headers: {
              'apikey' => api_key
            },
            timeout: 10
          )

          if response.success?
            instances = response.parsed_response || []
            instance_data = instances.find { |inst| inst['instanceName'] == instance }
            
            if instance_data
              status = instance_data['instance']['state'] || 'unknown'
              success_response({ connected: status == 'open', status: status })
            else
              error_response("Instância '#{instance}' não encontrada")
            end
          else
            error_response("Erro ao verificar conexão: #{response.body}")
          end
        rescue StandardError => e
          Rails.logger.error "❌ Error checking connection: #{e.message}"
          error_response("Erro ao verificar conexão: #{e.message}")
        end
      end

      # Verifica se a API está configurada e disponível para uma conta
      #
      # @param account [Account] Conta/empresa
      # @return [Boolean]
      def configured?(account:)
        return false unless account.present?
        config = get_config(account)
        config&.configured? || false
      end

      private

      # Busca ou cria a configuração WhatsApp para a conta
      #
      # @param account [Account] Conta/empresa
      # @return [WhatsappConfig, nil]
      def get_config(account)
        account.whatsapp_config || account.build_whatsapp_config
      end

      def normalize_phone(phone)
        # Remove todos os caracteres não numéricos
        normalized = phone.to_s.gsub(/\D/, '')
        
        # Se não começar com código do país, adiciona 55 (Brasil)
        normalized = "55#{normalized}" unless normalized.start_with?('55')
        
        normalized
      end

      def success_response(data)
        { success: true, response: data }
      end

      def error_response(message)
        { success: false, error: message }
      end
    end
  end
end


