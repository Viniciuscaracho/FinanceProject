# frozen_string_literal: true

module Api
  module V1
    class WhatsAppWebhookController < ApplicationController
      skip_before_action :authenticate_user!, only: [:webhook, :verify]

      def webhook
        return render json: { error: 'Invalid webhook' }, status: :unauthorized unless valid_webhook?

        # Evolution API: roteamento por tipo de evento
        if evolution_api_request?
          handle_evolution_event
          return render json: { status: 'received' }, status: :ok
        end

        # Meta / WhatsApp Cloud API oficial (object: whatsapp_business_account).
        # Sempre responde 200: a Meta reentrega em qualquer não-2xx e desabilita
        # o webhook após falhas seguidas.
        if meta_cloud_request?
          handle_meta_cloud
          return head :ok
        end

        # Twilio (BSP) — payload form-encoded legado
        message_data = extract_message_data
        account      = identify_account(message_data)

        return render json: { error: 'Account not found' }, status: :not_found unless account

        WhatsApp::ProcessMessageJob.perform_later(
          account_id:       account.id,
          message:          message_data[:message],
          whatsapp_number:  message_data[:from]
        )

        render json: { status: 'received' }, status: :ok
      rescue StandardError => e
        Rails.logger.error "❌ WhatsApp webhook error: #{e.message}"
        render json: { error: 'Internal server error' }, status: :internal_server_error
      end

      def verify
        # A Meta envia os parâmetros com ponto (hub.mode, hub.challenge,
        # hub.verify_token). No Rack a chave é literalmente "hub.mode" — NÃO
        # "hub_mode". Mantemos o fallback underscore para eventuais proxies.
        mode      = params['hub.mode']         || params[:hub_mode]
        token     = params['hub.verify_token'] || params[:hub_verify_token]
        challenge = params['hub.challenge']    || params[:hub_challenge]

        if mode == 'subscribe' &&
           ActiveSupport::SecurityUtils.secure_compare(token.to_s, verify_token.to_s)
          render plain: challenge.to_s, status: :ok
        else
          render json: { error: 'Invalid verification' }, status: :forbidden
        end
      end

      private

      def evolution_api_request?
        # Evolution API envia 'event' como campo top-level no body
        params[:event].present? || request.headers['apikey'].present?
      end

      def handle_evolution_event
        event    = params[:event].to_s
        instance = params[:instance].to_s

        # Número de inbox da plataforma: conta resolvida por mensagem a partir do telefone do remetente
        if instance == 'orbi_platform'
          handle_incoming_message(nil, params[:data] || {}) if messages_upsert_event?(event)
          return
        end

        account = account_from_instance(instance)
        return Rails.logger.warn("⚠️ Webhook Evolution: conta não encontrada para instância #{instance}") unless account

        case event
        when 'CONNECTION_UPDATE', 'connection.update'
          handle_connection_update(account, params[:data] || {})
        when 'MESSAGES_UPSERT', 'messages.upsert'
          handle_incoming_message(account, params[:data] || {})
        end
      end

      def handle_connection_update(account, data)
        state = data[:state].to_s

        if state == 'open'
          phone = extract_phone_from_connection_data(data)
          config = account.whatsapp_config || account.build_whatsapp_config

          was_disconnected = config.instance_status != 'open'
          config.update_columns(instance_status: 'open', connected_phone: phone) if config.persisted?

          # Mensagem de boas-vindas apenas na primeira conexão
          if was_disconnected && phone.present?
            Rails.logger.info "✅ WhatsApp conectado para conta ##{account.id} — número #{phone}"
            WhatsApp::EvolutionApiClient.send_message(
              account: account,
              phone:   phone,
              message: "✅ *WhatsApp conectado com sucesso!*\n\nA partir de agora você receberá confirmações de agendamentos, lembretes e avisos de cobrança diretamente aqui."
            )
          end
        elsif %w[close connecting].include?(state)
          config = account.whatsapp_config
          config&.update_columns(instance_status: state)
        end
      end

      def handle_incoming_message(account, data)
        messages = data.is_a?(Array) ? data : [data]
        messages.each do |msg|
          from    = msg.dig(:key, :remoteJid) || msg[:remoteJid]
          next if from.blank?
          next if from.include?('@g.us') # ignora grupos

          phone = from.split('@').first

          # Número de inbox da plataforma: resolve conta pelo telefone do treinador remetente
          resolved_account = account || account_from_sender_phone(phone)
          unless resolved_account
            Rails.logger.warn("⚠️ Webhook platform: nenhuma conta encontrada para telefone #{phone}")
            next
          end

          from_me = msg.dig(:key, :fromMe)

          # Áudio PTT de coaching:
          #   - from_me: true  → treinador gravou no próprio número conectado (fluxo legado)
          #   - from_me: false → treinador enviou para o número de inbox dedicado Orbi
          if msg.dig(:message, :audioMessage).present?
            msg_hash  = msg.respond_to?(:to_unsafe_h) ? msg.to_unsafe_h : msg.to_h
            ::Coaching::ProcessWhatsappAudioJob.perform_later(
              account_id:   resolved_account.id,
              message_key:  msg_hash['key']  || {},
              message_body: msg_hash['message'] || {},
              from:         phone
            )
            next
          end

          body = msg.dig(:message, :conversation) || msg.dig(:message, :extendedTextMessage, :text)
          next if body.blank?

          # Texto do próprio treinador = nota sobre atleta (formato "Nome: texto")
          if from_me
            ::Coaching::ProcessWhatsappMessageJob.perform_later(
              account_id:      resolved_account.id,
              message:         body,
              whatsapp_number: phone
            )
          else
            WhatsApp::ProcessMessageJob.perform_later(
              account_id:      resolved_account.id,
              message:         body,
              whatsapp_number: phone
            )
          end
        end
      end

      def extract_phone_from_connection_data(data)
        # Pode vir em data.me.id, data.number ou data.instance.owner
        jid = data.dig(:me, :id) || data[:number] || data.dig(:instance, :owner)
        jid&.split('@')&.first
      end

      def account_from_instance(instance_name)
        # Instâncias da plataforma: "orbi_<account_id>"
        if instance_name.start_with?('orbi_')
          account_id = instance_name.delete_prefix('orbi_').to_i
          return Account.find_by(id: account_id) if account_id > 0
        end

        # Instância customizada: busca pelo nome armazenado no whatsapp_config
        found = Account.joins(:whatsapp_config)
                       .find_by(whatsapp_configs: { evolution_instance_name: instance_name })
        return found if found

        # Fallback: account_id vem na URL (/webhook/:account_id)
        Account.find_by(id: params[:account_id]) if params[:account_id].present?
      end

      def messages_upsert_event?(event)
        %w[MESSAGES_UPSERT messages.upsert MESSAGES_SET messages.set].include?(event)
      end

      def account_from_sender_phone(phone)
        digits = phone.to_s.gsub(/\D/, '')
        # Tenta com o número exato, depois sem o DDI 55
        without_country = digits.start_with?('55') ? digits[2..] : nil
        user = User.find_by(whatsapp_number: digits) ||
               (without_country && User.find_by(whatsapp_number: without_country))
        return unless user
        Account.find_by(id: user.account_id)
      end

      # ── Meta / WhatsApp Cloud API oficial ──────────────────────────────────

      def meta_cloud_request?
        params[:object] == 'whatsapp_business_account'
      end

      # Percorre entry[].changes[].value.messages[]. Ignora notificações que não
      # sejam mensagens (statuses de sent/delivered/read etc.). Nunca levanta —
      # o webhook precisa retornar 200 mesmo com payload inesperado.
      def handle_meta_cloud
        Array(params[:entry]).each do |entry|
          Array(entry[:changes]).each do |change|
            value = change[:value] || {}
            next if Array(value[:messages]).blank? # statuses/outras notificações
            Array(value[:messages]).each { |msg| process_cloud_message(msg) }
          end
        end
      rescue StandardError => e
        Rails.logger.error "❌ WhatsApp Cloud webhook error: #{e.message}"
      end

      def process_cloud_message(msg)
        wamid = msg[:id].to_s
        return unless first_delivery?(wamid) # dedupe reentregas/duplicatas da Meta

        from    = msg[:from].to_s # E.164 só dígitos, ex.: "5511999999999"
        account = account_from_sender_phone(from)
        return Rails.logger.warn("⚠️ WhatsApp Cloud: conta não encontrada para #{from}") unless account

        case msg[:type]
        when 'text'
          enqueue_trainer_note(account, msg.dig(:text, :body), from)
        when 'interactive'
          title = msg.dig(:interactive, :button_reply, :title) ||
                  msg.dig(:interactive, :list_reply, :title)
          enqueue_trainer_note(account, title, from)
        when 'button'
          enqueue_trainer_note(account, msg.dig(:button, :text), from)
        when 'audio', 'voice'
          media_id = msg.dig(:audio, :id)
          ::Coaching::ProcessWhatsappCloudAudioJob.perform_later(
            account_id: account.id,
            media_id:   media_id,
            from:       from
          )
        else
          Rails.logger.info("ℹ️ WhatsApp Cloud: tipo '#{msg[:type]}' ignorado")
        end
      end

      # Plataforma unidirecional: toda mensagem recebida no número da Orbi é uma
      # nota do treinador sobre um atleta (formato "Nome: texto").
      def enqueue_trainer_note(account, body, from)
        return if body.blank?

        ::Coaching::ProcessWhatsappMessageJob.perform_later(
          account_id:      account.id,
          message:         body,
          whatsapp_number: from
        )
      end

      # Idempotência por wamid via cache atômico. Retorna true na primeira vez,
      # false se o id já foi visto (a Meta reentrega em retries e duplicatas).
      def first_delivery?(wamid)
        return true if wamid.blank?

        Rails.cache.write("wa:inbound:#{wamid}", 1, unless_exist: true, expires_in: 3.days)
      end

      def valid_webhook?
        # Evolution API: aceita se vier da nossa URL de Evolution ou com apikey conhecida
        if evolution_api_request?
          received_key = request.headers['apikey'].to_s
          platform_key = ENV['PLATFORM_WA_API_KEY'].to_s
          # Aceita se apikey bater com a da plataforma, ou se vier sem apikey (instâncias custom)
          return true if received_key.blank? || platform_key.blank?
          return ActiveSupport::SecurityUtils.secure_compare(received_key, platform_key)
        end

        # Meta/WhatsApp Cloud API: X-Hub-Signature-256: sha256=<hmac>
        if (hub_sig = request.headers['X-Hub-Signature-256']).present?
          app_secret = ENV['WHATSAPP_APP_SECRET']
          return false if app_secret.blank?

          expected = OpenSSL::HMAC.hexdigest('SHA256', app_secret, request.raw_post)
          received = hub_sig.delete_prefix('sha256=')
          return ActiveSupport::SecurityUtils.secure_compare(expected, received)
        end

        # Twilio: X-Twilio-Signature
        if (twilio_sig = request.headers['X-Twilio-Signature']).present?
          auth_token = ENV['TWILIO_AUTH_TOKEN']
          return false if auth_token.blank?

          validator = Twilio::Security::RequestValidator.new(auth_token)
          return validator.validate(request.original_url, request.POST, twilio_sig)
        end

        false
      rescue StandardError
        false
      end

      def extract_message_data
        if params[:Body] && params[:From]
          { message: params[:Body], from: params[:From], message_id: params[:MessageSid] }
        elsif params[:entry]&.first&.dig('changes')
          entry   = params[:entry][0]['changes'][0]
          message = entry['value']['messages']&.first
          { message: message['text']['body'], from: message['from'], message_id: message['id'] }
        else
          {
            message:    params[:message] || params[:body] || '',
            from:       params[:from] || params[:whatsapp_number] || params[:phone],
            message_id: params[:message_id] || SecureRandom.hex
          }
        end
      end

      def identify_account(message_data)
        if params[:account_id].present?
          account = Account.find_by(id: params[:account_id])
          return account if account
        end

        if params[:account_token].present?
          account = Account.find_by(id: params[:account_token])
          return account if account
        end

        if params[:instance_name].present?
          account = Account.joins(:whatsapp_config)
                           .where(whatsapp_configs: { evolution_instance_name: params[:instance_name], enabled: true })
                           .first
          return account if account
        end

        whatsapp_number = message_data[:from]&.gsub(/\D/, '')
        if whatsapp_number.present?
          account = Account.joins(:users)
                           .where(users: { whatsapp_number: whatsapp_number })
                           .first
          return account if account
        end

        Rails.env.development? ? Account.first : nil
      end

      def verify_token
        ENV.fetch('WHATSAPP_VERIFY_TOKEN') { raise 'WHATSAPP_VERIFY_TOKEN not configured' }
      end
    end
  end
end
