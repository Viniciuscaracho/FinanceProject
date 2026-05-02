# frozen_string_literal: true

module Api
  module V1
    class WhatsappConfigsController < ApplicationController
      before_action :set_current_account
      before_action :set_whatsapp_config, only: [:show, :update, :check_connection]

      # GET /api/v1/whatsapp_configs
      def show
        render json: whatsapp_config_json(@whatsapp_config)
      end

      # POST /api/v1/whatsapp_configs
      # PUT /api/v1/whatsapp_configs
      def create
        @whatsapp_config = Current.account.whatsapp_config || Current.account.build_whatsapp_config
        
        if @whatsapp_config.update(whatsapp_config_params)
          render json: whatsapp_config_json(@whatsapp_config), status: :created
        else
          render json: { errors: @whatsapp_config.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/whatsapp_configs
      # PUT /api/v1/whatsapp_configs
      def update
        if @whatsapp_config.update(whatsapp_config_params)
          render json: whatsapp_config_json(@whatsapp_config)
        else
          render json: { errors: @whatsapp_config.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/whatsapp_config/check_connection
      def check_connection
        result = WhatsApp::EvolutionApiClient.check_connection(account: Current.account)
        
        render json: {
          connected: result[:success] && result[:response][:connected],
          status: result[:response]&.dig(:status) || 'unknown',
          error: result[:error]
        }
      end

      private

      def set_whatsapp_config
        @whatsapp_config = Current.account.whatsapp_config
        
        unless @whatsapp_config
          render json: { error: 'WhatsApp configuration not found' }, status: :not_found
        end
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
          id: config.id,
          enabled: config.enabled,
          configured: config.configured?,
          evolution_api_url: config.evolution_api_url,
          evolution_instance_name: config.evolution_instance_name,
          # Não retornar a API key por segurança
          has_api_key: config.evolution_api_key.present?,
          created_at: config.created_at&.iso8601,
          updated_at: config.updated_at&.iso8601
        }
      end
    end
  end
end


