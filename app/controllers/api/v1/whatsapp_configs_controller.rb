# frozen_string_literal: true

module Api
  module V1
    class WhatsappConfigsController < ApplicationController
      before_action :set_current_account
      before_action :set_whatsapp_config, only: [:show, :update, :check_connection, :connection_status,
                                                  :qr_code, :pairing_code, :disconnect_instance]

      # GET /api/v1/whatsapp_config
      def show
        render json: whatsapp_config_json(@whatsapp_config)
      end

      # POST /api/v1/whatsapp_config
      def create
        @whatsapp_config = Current.account.whatsapp_config || Current.account.build_whatsapp_config

        if @whatsapp_config.update(whatsapp_config_params)
          render json: whatsapp_config_json(@whatsapp_config), status: :created
        else
          render json: { errors: @whatsapp_config.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/whatsapp_config
      def update
        if @whatsapp_config.update(whatsapp_config_params)
          render json: whatsapp_config_json(@whatsapp_config)
        else
          render json: { errors: @whatsapp_config.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/whatsapp_config/check_connection  (legado — mantido por compatibilidade)
      def check_connection
        result = WhatsApp::EvolutionApiClient.check_connection(account: Current.account)

        render json: {
          connected: result[:success] && result[:response][:connected],
          status: result[:response]&.dig(:status) || 'unknown',
          error: result[:error]
        }
      end

      # GET /api/v1/whatsapp_config/connection_status
      # Retorna status detalhado: { connected, status, phone }
      def connection_status
        result = WhatsApp::EvolutionApiClient.connection_status_detailed(account: Current.account)

        if result[:success]
          data = result[:response]
          # Atualiza cache de phone/status no banco
          @whatsapp_config.update_columns(
            connected_phone:  data[:phone],
            instance_status:  data[:status]
          )
          render json: {
            connected:    data[:connected],
            status:       data[:status],
            phone:        data[:phone],
            configured:   @whatsapp_config.configured? || platform_available?
          }
        else
          render json: {
            connected:  false,
            status:     'close',
            phone:      nil,
            configured: @whatsapp_config.configured? || platform_available?,
            error:      result[:error]
          }
        end
      end

      # GET /api/v1/whatsapp_config/qr_code
      # Retorna o QR code em base64 para o usuário escanear.
      def qr_code
        result = WhatsApp::EvolutionApiClient.fetch_qr_code(account: Current.account)

        if result[:success]
          data = result[:response]

          if data[:already_connected]
            render json: { already_connected: true, phone: data[:phone] }
          else
            render json: { base64: data[:base64], status: data[:status] }
          end
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/whatsapp_config/pairing_code
      # Body: { phone: "5511999990000" }
      # Retorna: { code: "ABCD-EFGH" }
      def pairing_code
        phone = params[:phone].to_s.strip
        return render json: { error: 'Número de telefone é obrigatório' }, status: :unprocessable_entity if phone.blank?

        result = WhatsApp::EvolutionApiClient.request_pairing_code(account: Current.account, phone: phone)

        if result[:success]
          render json: { code: result[:response][:code] }
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/whatsapp_config/disconnect
      def disconnect_instance
        result = WhatsApp::EvolutionApiClient.disconnect_instance(account: Current.account)

        @whatsapp_config.update_columns(
          connected_phone: nil,
          instance_status: 'close'
        )

        if result[:success]
          render json: { success: true }
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      private

      def set_whatsapp_config
        @whatsapp_config = Current.account.whatsapp_config ||
                           Current.account.create_whatsapp_config!(
                             evolution_instance_name: "orbi_#{Current.account.id}"
                           )
      end

      def whatsapp_config_params
        params.require(:whatsapp_config).permit(
          :enabled,
          :evolution_api_url,
          :evolution_api_key,
          :evolution_instance_name
        )
      end

      def whatsapp_config_json(config)
        {
          id:                      config.id,
          enabled:                 config.enabled,
          configured:              config.configured? || platform_available?,
          evolution_api_url:       config.evolution_api_url,
          evolution_instance_name: config.evolution_instance_name,
          has_api_key:             config.evolution_api_key.present?,
          connected_phone:         config.connected_phone,
          instance_status:         config.instance_status,
          created_at:              config.created_at&.iso8601,
          updated_at:              config.updated_at&.iso8601
        }
      end

      def platform_available?
        WhatsApp::EvolutionApiClient.platform_configured?
      end
    end
  end
end
