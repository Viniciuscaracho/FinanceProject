# frozen_string_literal: true

module Api
  module V1
    class ApplicationController < ActionController::API
      include ActionController::HttpAuthentication::Token::ControllerMethods
      
      before_action :authenticate_user!
      before_action :set_current_account
      
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from CanCan::AccessDenied, with: :forbidden
      
      private
      
      def authenticate_user!
        @current_user = authenticate_with_http_token do |token, options|
          Rails.logger.info "Tentando autenticar com token: #{token[0..20]}..."
          
          # Tentar decodificar token base64 primeiro
          begin
            decoded_token = JSON.parse(Base64.strict_decode64(token))
            user_id = decoded_token['user_id']
            exp = decoded_token['exp']
            
            Rails.logger.info "Token decodificado - user_id: #{user_id}, exp: #{exp}"
            
            # Verificar se o token não expirou
            if exp && Time.current.to_i > exp
              Rails.logger.warn "Token expirado"
              nil # Token expirado
            else
              user = User.find_by(id: user_id)
              Rails.logger.info "Usuário encontrado: #{user&.email}"
              user
            end
          rescue JSON::ParserError, ArgumentError => e
            Rails.logger.info "Erro ao decodificar token: #{e.message}"
            # Se não for base64, tentar como api_token
            user = User.find_by(api_token: token)
            Rails.logger.info "Tentando como api_token: #{user&.email}"
            user
          end
        end
        
        Rails.logger.info "Usuário autenticado: #{@current_user&.email}"
        render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
      end
      
      def set_current_account
        Current.user = @current_user
        Current.account = @current_user.account
      end
      
      def not_found
        render json: { error: 'Not found' }, status: :not_found
      end
      
      def forbidden
        render json: { error: 'Forbidden' }, status: :forbidden
      end
      
      def current_user
        @current_user
      end
    end
  end
end 