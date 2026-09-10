# frozen_string_literal: true

module Api
  module V1
    class ApplicationController < ActionController::API
      include ActionController::HttpAuthentication::Token::ControllerMethods
      include SessionManagement
      include AccountCache
      include SafeErrorHandling
      
      before_action :authenticate_user!
      before_action :set_current_account
      before_action :enforce_coaching_only_mode!
      before_action :create_or_refresh_session, if: :should_manage_session?
      # validate_session! é chamado automaticamente pelo SessionManagement

      # Modo enxuto de coaching: quando COACHING_ONLY_MODE está ligado, apenas os
      # controllers essenciais ao fluxo de coaching (recebimento de áudio/mensagem
      # → análise para o coach) respondem; o restante da plataforma retorna 403.
      # Reverter = desligar a env. Nada é removido.
      COACHING_ONLY_ALLOWED_CONTROLLERS = %w[
        api/v1/auth
        api/v1/public
        api/v1/coaching
        api/v1/whats_app_webhook
        api/v1/whatsapp_config
        api/v1/whatsapp_messages
        api/v1/contacts
        api/v1/users
        api/v1/account_settings
        api/v1/admin
        api/v1/english
      ].freeze
      
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from CanCan::AccessDenied, with: :forbidden
      rescue_from StandardError, with: :handle_internal_error
      
      private
      
      def handle_internal_error(exception)
        Rails.logger.error "=== Internal Server Error ==="
        Rails.logger.error "Exception: #{exception.class.name}"
        Rails.logger.error "Message: #{exception.message}"
        Rails.logger.error "Backtrace:"
        Rails.logger.error exception.backtrace.join("\n")

        return if performed?

        render json: {
          success: false,
          error: Rails.env.development? ? "Erro interno do servidor: #{exception.message}" : "Erro interno do servidor",
          details: Rails.env.development? ? exception.backtrace.first(5) : nil
        }, status: :internal_server_error
      end
      
      def authenticate_user!
        begin
          Rails.logger.info "=== Authenticate User ==="
          auth_header = request.headers['Authorization']
          Rails.logger.info "Authorization header: #{auth_header&.[](0..100)}"
          
          # Verificar se o header Authorization existe
          unless auth_header
            Rails.logger.error "Header Authorization não encontrado"
            render json: { error: 'Unauthorized', message: 'Token de autenticação não fornecido' }, status: :unauthorized
            return false
          end
          
          @current_user = authenticate_with_http_token do |token, options|
            Rails.logger.info "Tentando autenticar com token: #{token[0..20]}..."
            
            begin
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
            rescue => e
              Rails.logger.error "Erro durante autenticação: #{e.class}: #{e.message}"
              Rails.logger.error e.backtrace.join("\n")
              nil
            end
          end
          
          Rails.logger.info "Usuário autenticado: #{@current_user&.email}"
          unless @current_user
            Rails.logger.error "Falha na autenticação - nenhum usuário encontrado"
            render json: { error: 'Unauthorized', message: 'Token inválido ou expirado' }, status: :unauthorized
            return false
          end
          
          true
        rescue => e
          Rails.logger.error "Erro em authenticate_user!: #{e.class}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: {
            error: 'Erro interno na autenticação',
            details: Rails.env.development? ? e.backtrace.first(5) : nil
          }, status: :internal_server_error
          false
        end
      end
      
      def set_current_account
        begin
          Rails.logger.info "=== Set Current Account ==="
          Rails.logger.info "Current user: #{@current_user&.email}"
          
          unless @current_user
            Rails.logger.error "set_current_account chamado sem @current_user"
            return true # Permitir continuar para alguns endpoints
          end
          
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
          begin
            Current.account = @current_user.account || @current_user.accounts.first
            Rails.logger.info "Current.account: #{Current.account&.id}"
          rescue => e
            Rails.logger.error "Erro ao obter conta do usuário: #{e.class}: #{e.message}"
            Rails.logger.error e.backtrace.join("\n")
            Current.account = nil
          end
          
          unless Current.account
            Rails.logger.warn "Usuário não tem conta associada - permitindo continuar para alguns endpoints"
            # Não renderizar erro aqui, deixar o controller decidir
          end
          
          true
        rescue => e
          Rails.logger.error "Erro em set_current_account: #{e.class}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          # Não renderizar erro aqui para não quebrar a cadeia de before_actions
          # O rescue_from StandardError vai capturar se necessário
          true
        end
      end
      
      # Gate do modo enxuto de coaching. Bloqueia (403) qualquer controller da API
      # que não faça parte do fluxo essencial de coaching enquanto a env estiver
      # ligada. Autenticação continua rodando antes (endpoints bloqueados ainda
      # exigem login), então o comportamento é: 401 se anônimo, 403 se autenticado
      # mas fora do escopo de coaching.
      def enforce_coaching_only_mode!
        return unless coaching_only_mode?
        return if coaching_only_controller_allowed?

        render json: {
          error: 'Forbidden',
          message: 'Recurso indisponível: a plataforma está em modo coaching (apenas o fluxo de coaching está ativo).'
        }, status: :forbidden
      end

      def coaching_only_mode?
        ActiveModel::Type::Boolean.new.cast(ENV['COACHING_ONLY_MODE'])
      end

      def coaching_only_controller_allowed?
        path = controller_path # ex.: "api/v1/coaching/timeline_events"
        COACHING_ONLY_ALLOWED_CONTROLLERS.any? do |allowed|
          path == allowed || path.start_with?("#{allowed}/")
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