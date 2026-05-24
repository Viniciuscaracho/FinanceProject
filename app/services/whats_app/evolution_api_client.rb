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

      # Retorna o QR Code (base64) para o usuário escanear.
      # Cria a instância na Evolution API se ela ainda não existir.
      # Se a instância estiver presa em "connecting", reinicia antes de gerar o QR.
      #
      # @return [Hash] { success: true, base64: "data:image/png;base64,..." }
      #              | { success: false, error: "..." }
      #              | { success: true, already_connected: true, phone: "..." }
      def fetch_qr_code(account:)
        params = effective_params(account)
        return error_response('Evolution API não configurada') unless params

        ensure_instance(**params)

        state = connection_state(**params)
        if state == 'open'
          phone = fetch_connected_phone(**params)
          return success_response({ already_connected: true, phone: phone })
        end

        # Instância presa em "connecting" — sessão anterior não foi limpa.
        # Deleta e recria para garantir um QR fresco e válido.
        if state == 'connecting'
          Rails.logger.info "🔄 [WhatsApp] Instância #{params[:instance]} presa em connecting — reiniciando"
          delete_and_recreate_instance(**params)
          sleep(1.5)
        end

        response = HTTParty.get(
          "#{params[:base_url]}/instance/connect/#{params[:instance]}",
          headers: { 'apikey' => params[:api_key] },
          timeout: 15
        )

        return error_response("Erro ao gerar QR: #{response.body}") unless response.success?

        body = response.parsed_response
        base64 = body['base64'] || body['qrcode']
        return error_response('QR code não retornado pela API') if base64.blank?

        success_response({ base64: base64, status: 'connecting' })
      rescue StandardError => e
        Rails.logger.error "❌ fetch_qr_code error: #{e.message}"
        error_response("Erro ao buscar QR: #{e.message}")
      end

      # Solicita um código de pareamento por número de telefone (alternativa ao QR).
      # O usuário deve digitar o código de 8 dígitos no WhatsApp → Dispositivos → Usar número.
      #
      # Requisitos Evolution API v2:
      #   - Instância deve estar em estado 'close' (não 'connecting' ou 'open')
      #   - Endpoint: GET /instance/connect/{instance}?number={phone}
      #
      # @param phone [String] Número completo com DDI, ex: "5511999990000"
      # @return [Hash] { success: true, code: "ABCD1234" }
      def request_pairing_code(account:, phone:)
        params = effective_params(account)
        return error_response('Evolution API não configurada') unless params

        normalized = normalize_phone(phone)
        return error_response('Número inválido') if normalized.length < 12

        # Garante instância em estado 'close' para que o pairingCode seja gerado
        ensure_instance(**params)
        state = connection_state(**params)

        if state == 'open'
          return error_response('WhatsApp já está conectado. Desconecte antes de vincular outro número.')
        end

        if state == 'connecting'
          # Reseta para 'close' para que o pairing funcione
          delete_and_recreate_instance(**params)
          sleep(1)
        end

        response = HTTParty.get(
          "#{params[:base_url]}/instance/connect/#{params[:instance]}",
          headers: { 'apikey' => params[:api_key] },
          query: { number: normalized },
          timeout: 20
        )

        return error_response("Erro ao solicitar código: #{response.body}") unless response.success?

        body = response.parsed_response
        code = body['pairingCode'] || body['code']
        # 'code' longo é chave criptográfica do WebSocket, não o pairing code do usuário
        return error_response('Código de pareamento não retornado. Verifique o número e tente novamente.') if code.blank? || code.length > 20

        success_response({ code: code })
      rescue StandardError => e
        Rails.logger.error "❌ request_pairing_code error: #{e.message}"
        error_response("Erro ao solicitar código: #{e.message}")
      end

      # Status detalhado da conexão, incluindo telefone e nome do perfil.
      #
      # @return [Hash] { connected: bool, status: string, phone: string, profile_name: string }
      def connection_status_detailed(account:)
        params = effective_params(account)
        return error_response('Evolution API não configurada') unless params

        response = HTTParty.get(
          "#{params[:base_url]}/instance/connectionState/#{params[:instance]}",
          headers: { 'apikey' => params[:api_key] },
          timeout: 10
        )

        if response.success?
          body    = response.parsed_response
          state   = body.dig('instance', 'state') || body['state'] || 'close'
          connected = state == 'open'
          phone   = connected ? fetch_connected_phone(**params) : nil
          success_response({ connected: connected, status: state, phone: phone })
        else
          success_response({ connected: false, status: 'close', phone: nil })
        end
      rescue StandardError => e
        Rails.logger.error "❌ connection_status_detailed error: #{e.message}"
        error_response("Erro ao verificar status: #{e.message}")
      end

      # Desconecta a instância (logout do WhatsApp).
      def disconnect_instance(account:)
        params = effective_params(account)
        return error_response('Evolution API não configurada') unless params

        response = HTTParty.delete(
          "#{params[:base_url]}/instance/logout/#{params[:instance]}",
          headers: { 'apikey' => params[:api_key] },
          timeout: 10
        )

        response.success? ? success_response({}) : error_response("Erro ao desconectar: #{response.body}")
      rescue StandardError => e
        error_response("Erro ao desconectar: #{e.message}")
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

      # Retorna { base_url:, api_key:, instance:, account_id: } priorizando config
      # da conta, com fallback para credenciais da plataforma (ENV).
      def effective_params(account)
        config = get_config(account)

        if config.evolution_api_url.present? && config.evolution_api_key.present?
          {
            base_url:   config.normalized_api_url,
            api_key:    config.evolution_api_key,
            instance:   config.evolution_instance_name.presence || "orbi_#{account.id}",
            account_id: account.id
          }
        elsif ENV['PLATFORM_WA_API_URL'].present? && ENV['PLATFORM_WA_API_KEY'].present?
          {
            base_url:   ENV['PLATFORM_WA_API_URL'].chomp('/'),
            api_key:    ENV['PLATFORM_WA_API_KEY'],
            instance:   "orbi_#{account.id}",
            account_id: account.id
          }
        end
      end

      # URL do webhook para esta conta — Evolution API vai notificar aqui nos eventos de conexão.
      def webhook_url_for(account_id)
        host = ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')
        scheme = host.include?('localhost') ? 'http' : 'https'
        "#{scheme}://#{host}/api/v1/whatsapp/webhook/#{account_id}"
      end

      # Payload de criação de instância com webhook configurado.
      def instance_create_body(instance:, account_id:)
        {
          instanceName: instance,
          integration:  'WHATSAPP-BAILEYS',
          webhook: {
            enabled:      true,
            url:          webhook_url_for(account_id),
            byEvents:     true,
            base64:       false,
            events:       %w[CONNECTION_UPDATE MESSAGES_UPSERT QRCODE_UPDATED]
          }
        }.to_json
      end

      # Deleta a instância e a recria do zero (usada quando está presa em "connecting").
      def delete_and_recreate_instance(base_url:, api_key:, instance:, account_id:, **)
        HTTParty.delete(
          "#{base_url}/instance/delete/#{instance}",
          headers: { 'apikey' => api_key },
          timeout: 10
        )
        sleep(0.5)
        HTTParty.post(
          "#{base_url}/instance/create",
          headers: { 'Content-Type' => 'application/json', 'apikey' => api_key },
          body: instance_create_body(instance: instance, account_id: account_id),
          timeout: 15
        )
      rescue StandardError => e
        Rails.logger.warn "⚠️ delete_and_recreate_instance: #{e.message}"
      end

      # Cria a instância na Evolution API se ela ainda não existir.
      def ensure_instance(base_url:, api_key:, instance:, account_id:, **)
        list_response = HTTParty.get(
          "#{base_url}/instance/fetchInstances",
          headers: { 'apikey' => api_key },
          timeout: 10
        )

        return unless list_response.success?

        instances = list_response.parsed_response || []
        exists = instances.any? { |i| i['instanceName'] == instance || i['name'] == instance }
        return if exists

        HTTParty.post(
          "#{base_url}/instance/create",
          headers: { 'Content-Type' => 'application/json', 'apikey' => api_key },
          body: instance_create_body(instance: instance, account_id: account_id),
          timeout: 15
        )
      rescue StandardError => e
        Rails.logger.warn "⚠️ ensure_instance: #{e.message}"
      end

      # Estado bruto da conexão ('open', 'connecting', 'close').
      def connection_state(base_url:, api_key:, instance:, **)
        response = HTTParty.get(
          "#{base_url}/instance/connectionState/#{instance}",
          headers: { 'apikey' => api_key },
          timeout: 10
        )
        return 'close' unless response.success?

        body = response.parsed_response
        body.dig('instance', 'state') || body['state'] || 'close'
      rescue StandardError
        'close'
      end

      # Busca o número de telefone da instância conectada.
      # Evolution API v2 retorna o número em `ownerJid` no nível raiz do objeto.
      def fetch_connected_phone(base_url:, api_key:, instance:, **)
        response = HTTParty.get(
          "#{base_url}/instance/fetchInstances",
          headers: { 'apikey' => api_key },
          timeout: 10
        )
        return nil unless response.success?

        instances = response.parsed_response || []
        data = instances.find { |i| i['instanceName'] == instance || i['name'] == instance }
        owner_jid = data&.dig('ownerJid') ||
                    data&.dig('instance', 'owner') ||
                    data&.dig('owner')
        owner_jid&.split('@')&.first
      rescue StandardError
        nil
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


