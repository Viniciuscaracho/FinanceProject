# frozen_string_literal: true

module WhatsApp
  class EvolutionApiClient
    class << self
      # Envia via bot da conta; se não configurado, cai no bot da plataforma.
      def send_message(account:, phone:, message:, retries: 2)
        return error_response('Account é obrigatório') unless account.present?
        return error_response('Número de telefone é obrigatório') unless phone.present?
        return error_response('Mensagem é obrigatória') unless message.present?

        config = get_config(account)

        if config&.configured?
          post_text_message(
            base_url: config.normalized_api_url,
            api_key:  config.evolution_api_key,
            instance: config.evolution_instance_name,
            phone:    phone,
            message:  message,
            retries:  retries,
            tag:      "conta ##{account.id}"
          )
        else
          send_via_platform(phone: phone, message: message, retries: retries)
        end
      end

      # Envia exclusivamente pelo bot central da plataforma (ENV: PLATFORM_WA_*).
      def send_via_platform(phone:, message:, retries: 2)
        return error_response('Plataforma não configurada') unless platform_configured?

        post_text_message(
          base_url: ENV['PLATFORM_WA_API_URL'].chomp('/'),
          api_key:  ENV['PLATFORM_WA_API_KEY'],
          instance: ENV['PLATFORM_WA_INSTANCE'],
          phone:    phone,
          message:  message,
          retries:  retries,
          tag:      'plataforma'
        )
      end

      # Verdadeiro se o bot central da plataforma estiver configurado via ENV.
      def platform_configured?
        ENV['PLATFORM_WA_API_URL'].present? &&
          ENV['PLATFORM_WA_API_KEY'].present? &&
          ENV['PLATFORM_WA_INSTANCE'].present?
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

      def post_text_message(base_url:, api_key:, instance:, phone:, message:, retries:, tag:)
        normalized_phone = normalize_phone(phone)
        attempt = 0
        last_error = nil

        while attempt <= retries
          begin
            response = HTTParty.post(
              "#{base_url}/message/sendText/#{instance}",
              headers: { 'Content-Type' => 'application/json', 'apikey' => api_key },
              body: { number: normalized_phone, text: message }.to_json,
              timeout: 30
            )

            if response.success?
              Rails.logger.info "✅ [WhatsApp #{tag}] Mensagem enviada para #{normalized_phone}"
              return success_response(response.parsed_response)
            else
              error_msg = response.parsed_response&.dig('message') || response.body || 'Erro desconhecido'
              last_error = "Erro: #{error_msg} (#{response.code})"

              if response.code >= 400 && response.code < 500
                Rails.logger.error "❌ [WhatsApp #{tag}] #{last_error}"
                return error_response(last_error)
              end

              Rails.logger.warn "⚠️ [WhatsApp #{tag}] #{last_error} (tentativa #{attempt + 1}/#{retries + 1})"
            end
          rescue HTTParty::Error => e
            last_error = "Erro de conexão: #{e.message}"
            Rails.logger.warn "⚠️ [WhatsApp #{tag}] #{last_error}"
          rescue StandardError => e
            last_error = "Erro inesperado: #{e.message}"
            Rails.logger.error "❌ [WhatsApp #{tag}] #{last_error}"
          end

          attempt += 1
          sleep(2**attempt) if attempt <= retries
        end

        Rails.logger.error "❌ [WhatsApp #{tag}] Falha após #{retries + 1} tentativas: #{last_error}"
        error_response(last_error)
      end

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


