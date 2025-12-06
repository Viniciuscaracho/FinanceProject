# frozen_string_literal: true

module Api
  module V1
    class WhatsAppWebhookController < ApplicationController
      skip_before_action :authenticate_user!, only: [:webhook, :verify]

      # POST /api/v1/whatsapp/webhook
      def webhook
        # Validar webhook (verificar assinatura, etc.)
        unless valid_webhook?
          render json: { error: 'Invalid webhook' }, status: :unauthorized
          return
        end

        # Extrair dados da mensagem
        message_data = extract_message_data
        
        # Identificar account (pode ser por número do WhatsApp, token, etc.)
        account = identify_account(message_data)
        
        unless account
          render json: { error: 'Account not found' }, status: :not_found
          return
        end

        # Processar mensagem assincronamente
        WhatsApp::ProcessMessageJob.perform_later(
          account_id: account.id,
          message: message_data[:message],
          whatsapp_number: message_data[:from]
        )

        # Responder imediatamente ao webhook
        render json: { status: 'received' }, status: :ok
      rescue StandardError => e
        Rails.logger.error "WhatsApp Webhook Error: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Internal server error' }, status: :internal_server_error
      end

      # GET /api/v1/whatsapp/webhook (para verificação do webhook)
      def verify
        # Verificação do webhook (usado por alguns provedores)
        if params[:hub_mode] == 'subscribe' && params[:hub_verify_token] == verify_token
          render plain: params[:hub_challenge], status: :ok
        else
          render json: { error: 'Invalid verification' }, status: :forbidden
        end
      end

      private

      def valid_webhook?
        # Implementar validação de assinatura do webhook
        # Por exemplo, verificar assinatura do Twilio, WhatsApp Business API, etc.
        true # Por enquanto, aceitar todos (NÃO FAZER ISSO EM PRODUÇÃO!)
      end

      def extract_message_data
        # Formato pode variar dependendo do provedor (Twilio, WhatsApp Business API, etc.)
        # Exemplo para Twilio:
        if params[:Body] && params[:From]
          {
            message: params[:Body],
            from: params[:From],
            message_id: params[:MessageSid]
          }
        # Exemplo para WhatsApp Business API:
        elsif params[:entry] && params[:entry][0] && params[:entry][0]['changes']
          entry = params[:entry][0]['changes'][0]
          value = entry['value']
          message = value['messages']&.first
          
          {
            message: message['text']['body'],
            from: message['from'],
            message_id: message['id']
          }
        else
          # Formato genérico para testes
          {
            message: params[:message] || params[:body] || '',
            from: params[:from] || params[:whatsapp_number] || params[:phone],
            message_id: params[:message_id] || SecureRandom.hex
          }
        end
      end

      def identify_account(message_data)
        # Estratégias para identificar o account:
        # 1. Por número do WhatsApp (se configurado)
        # 2. Por token na URL
        # 3. Por header de autenticação
        
        # Por token na URL (para testes)
        if params[:account_token].present?
          account = Account.find_by(id: params[:account_token])
          return account if account
        end

        # Por número do WhatsApp (se houver configuração)
        whatsapp_number = message_data[:from]&.gsub(/\D/, '')
        if whatsapp_number.present?
          # Buscar account que tem este número configurado
          # (você pode criar uma tabela account_whatsapp_configs)
          account = Account.joins(:account_users)
                          .where('account_users.whatsapp_number = ?', whatsapp_number)
                          .first
          return account if account
        end

        # Default: usar o primeiro account (apenas para desenvolvimento)
        if Rails.env.development?
          Account.first
        else
          nil
        end
      end

      def verify_token
        ENV['WHATSAPP_VERIFY_TOKEN'] || 'default_verify_token'
      end
    end
  end
end

