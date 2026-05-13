# frozen_string_literal: true

module Api
  module V1
    class WhatsAppWebhookController < ApplicationController
      skip_before_action :authenticate_user!, only: [:webhook, :verify]

      def webhook
        return render json: { error: 'Invalid webhook' }, status: :unauthorized unless valid_webhook?

        message_data = extract_message_data
        account      = identify_account(message_data)

        return render json: { error: 'Account not found' }, status: :not_found unless account

        WhatsApp::ProcessMessageJob.perform_later(
          account_id:       account.id,
          message:          message_data[:message],
          whatsapp_number:  message_data[:from]
        )

        render json: { status: 'received' }, status: :ok
      rescue StandardError
        render json: { error: 'Internal server error' }, status: :internal_server_error
      end

      def verify
        if params[:hub_mode] == 'subscribe' && params[:hub_verify_token] == verify_token
          render plain: params[:hub_challenge], status: :ok
        else
          render json: { error: 'Invalid verification' }, status: :forbidden
        end
      end

      private

      def valid_webhook?
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
          account = Account.joins(:account_users)
                           .where('account_users.whatsapp_number = ?', whatsapp_number)
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
