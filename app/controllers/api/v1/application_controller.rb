# frozen_string_literal: true

module Api
  module V1
    class ApplicationController < ActionController::API
      include ActionController::HttpAuthentication::Token::ControllerMethods
      include SessionManagement
      include AccountCache
      
      before_action :authenticate_user!
      before_action :set_current_account
      before_action :create_or_refresh_session, if: :should_manage_session?
      # validate_session! é chamado automaticamente pelo SessionManagement
      
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from CanCan::AccessDenied, with: :forbidden
      
      private
      
      def authenticate_user!
        Rails.logger.info "=== Authenticate User ==="
        auth_header = request.headers['Authorization']
        Rails.logger.info "Authorization header: #{auth_header&.[](0..100)}"
        
        # Verificar se o header Authorization existe
        unless auth_header
          Rails.logger.error "Header Authorization não encontrado"
          render json: { error: 'Unauthorized', message: 'Token de autenticação não fornecido' }, status: :unauthorized
          return
        end
        
        @current_user = authenticate_with_http_token do |token, options|
          Rails.logger.info "Tentando autenticar com token: #{token[0..20]}..."
          
          # Primeiro, tentar autenticação via Supabase
          if Rails.application.config.supabase[:jwt_secret].present?
            supabase_user = Supabase::Auth.get_user_from_token(token)
            if supabase_user
              Rails.logger.info "Usuário autenticado via Supabase: #{supabase_user.email}"
              return supabase_user
            end
          end
          
          # Tentar decodificar token base64 (sistema legado)
          begin
            decoded_token = JSON.parse(Base64.strict_decode64(token))
            user_id = decoded_token['user_id']
            exp = decoded_token['exp']
            
            Rails.logger.info "Token decodificado - user_id: #{user_id}, exp: #{exp}, current_time: #{Time.current.to_i}"
            
            # Verificar se o token não expirou
            if exp && Time.current.to_i > exp
              Rails.logger.warn "Token expirado - exp: #{exp}, current: #{Time.current.to_i}"
              nil # Token expirado
            else
              user = User.find_by(id: user_id)
              Rails.logger.info "Usuário encontrado: #{user&.email}"
              
              unless user
                Rails.logger.error "Usuário não encontrado com ID: #{user_id}"
                nil
              else
                # Se estiver em modo de suporte, armazenar informações do admin original
                if decoded_token['impersonating'] && decoded_token['admin_user_id']
                  @admin_user_id = decoded_token['admin_user_id']
                  @admin_account_id = decoded_token['admin_account_id']
                  Rails.logger.info "Modo de suporte ativo - Admin ID: #{@admin_user_id}"
                end
                
                user
              end
            end
          rescue JSON::ParserError, ArgumentError => e
            Rails.logger.info "Erro ao decodificar token: #{e.message}"
            Rails.logger.info "Tentando como api_token..."
            # Se não for base64, tentar como api_token
            user = User.find_by(api_token: token)
            Rails.logger.info "Tentando como api_token: #{user&.email}"
            user
          end
        end
        
        Rails.logger.info "Usuário autenticado: #{@current_user&.email}"
        unless @current_user
          Rails.logger.error "Falha na autenticação - nenhum usuário encontrado"
          render json: { error: 'Unauthorized', message: 'Token inválido ou expirado' }, status: :unauthorized
        end
      end
      
      def set_current_account
        Rails.logger.info "=== Set Current Account ==="
        Rails.logger.info "Current user: #{@current_user&.email}"
        
        Current.user = @current_user
        
        # Se estiver em modo de suporte, armazenar informações do admin
        if @admin_user_id
          Current.impersonating = true
          Current.admin_user_id = @admin_user_id
          Current.admin_account_id = @admin_account_id
          Rails.logger.info "Modo de suporte - Admin ID: #{@admin_user_id}"
        else
          Current.impersonating = false
          Current.admin_user_id = nil
          Current.admin_account_id = nil
        end
        
        # Usar account direta ou primeira account através de account_users
        Current.account = @current_user.account || @current_user.accounts.first
        
        Rails.logger.info "Current.account: #{Current.account&.id}"
        
        unless Current.account
          Rails.logger.error "Usuário não tem conta associada"
          render json: { error: 'User has no account' }, status: :forbidden
        end
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

      # Cria ou atualiza a sessão após autenticação bem-sucedida
      def create_or_refresh_session
        return unless @current_user && Current.account

        @session_key = create_session(@current_user, Current.account)
        Rails.logger.info "Sessão criada/atualizada: #{@session_key}"
      end

      # Verifica se deve gerenciar sessão (pode ser sobrescrito em controllers filhos)
      def should_manage_session?
        true
      end
    end
  end
end 