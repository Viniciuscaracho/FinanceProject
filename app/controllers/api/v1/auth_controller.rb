# frozen_string_literal: true

module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:login, :login_simple, :google_oauth_url, :google_oauth_callback, :firebase_login, :test_user, :debug_user, :test_logs, :create_test_user]
      skip_before_action :set_current_account, only: [:login, :login_simple, :google_oauth_url, :google_oauth_callback, :firebase_login, :test_user, :debug_user, :test_logs, :create_test_user]
      before_action :set_user, only: [:me, :logout]

      def login
        puts "=== REQUISIÇÃO CHEGOU NO BACKEND ==="
        puts "Método: #{request.method}"
        puts "URL: #{request.url}"
        puts "Headers: #{request.headers.to_h.select { |k,v| k.start_with?('HTTP_') }}"
        puts "Body: #{request.body.read}"
        puts "Parâmetros: #{params.inspect}"
        
        # Usar a mesma consulta que funciona no debug
        user = User.where(email: params[:email]).first
        puts "Usuário encontrado: #{user&.id} - #{user&.email}"
        
        if user&.valid_password?(params[:password])
          puts "Senha válida, gerando token para usuário ID: #{user.id}"
          user_response = user_data(user)
          puts "Resposta do user_data: #{user_response.inspect}"
          
          response_data = {
            success: true,
            user: user_response,
            token: generate_token(user)
          }
          
          puts "Resposta final: #{response_data.inspect}"
          render json: response_data
        else
          puts "Login falhou para email: #{params[:email]}"
          render json: { 
            success: false, 
            error: 'Email ou senha inválidos' 
          }, status: :unauthorized
        end
      end

      def firebase_login
        user_data = params.permit(:uid, :email, :name, :photo_url, :provider)
        
        # Buscar usuário pelo UID do Firebase ou criar novo
        user = User.find_or_initialize_by(uid: user_data[:uid])
        
        if user.new_record?
          # Criar novo usuário
          user.email = user_data[:email]
          user.first_name = user_data[:name]&.split(' ')&.first || ''
          user.last_name = user_data[:name]&.split(' ')&.last || ''
          user.provider = user_data[:provider] || 'firebase'
          user.password = Devise.friendly_token[0, 20]
          
          # Definir conta padrão se necessário
          if user.accounts.empty?
            account = Account.create!(
              name: "Conta Principal",
              account_type: 'personal',
              default_currency: 'BRL'
            )
            user.accounts << account
          end
          
          unless user.save
            render json: { 
              success: false, 
              error: 'Erro ao criar usuário',
              details: user.errors.full_messages 
            }, status: :unprocessable_entity
            return
          end
        else
          # Atualizar dados do usuário existente
          user.update(
            email: user_data[:email],
            first_name: user_data[:name]&.split(' ')&.first || user.first_name,
            last_name: user_data[:name]&.split(' ')&.last || user.last_name
          )
        end
        
        # Fazer login do usuário
        sign_in user
        
        render json: {
          success: true,
          user: user_data(user),
          token: generate_token(user)
        }
      rescue => e
        Rails.logger.error "Erro no firebase_login: #{e.message}"
        render json: { 
          success: false, 
          error: 'Erro interno do servidor' 
        }, status: :internal_server_error
      end

      def google_oauth_url
        # Gerar URL de autorização do Google
        client_id = ENV['GOOGLE_CLIENT_ID'] || 'test_client_id'
        redirect_uri = "#{request.base_url}/oauth/callback"
        scope = 'email profile'
        
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" +
                   "client_id=#{client_id}&" +
                   "redirect_uri=#{CGI.escape(redirect_uri)}&" +
                   "scope=#{CGI.escape(scope)}&" +
                   "response_type=code&" +
                   "access_type=offline&" +
                   "prompt=consent"
        
        render json: { auth_url: auth_url }
      end

      def google_oauth_callback
        code = params[:code]
        
        if code.blank?
          render json: { error: 'Código de autorização não fornecido' }, status: :bad_request
          return
        end

        # Trocar código por token de acesso
        token_response = exchange_code_for_token(code)
        
        if token_response[:error]
          render json: { error: token_response[:error] }, status: :bad_request
          return
        end

        # Obter informações do usuário do Google
        user_info = get_google_user_info(token_response[:access_token])
        
        if user_info[:error]
          render json: { error: user_info[:error] }, status: :bad_request
          return
        end

        # Criar ou encontrar usuário
        user = User.from_omniauth_data(user_info)
        
        if user.persisted?
          render json: {
            success: true,
            user: user_data(user),
            token: generate_token(user)
          }
        else
          render json: { 
            error: 'Erro ao criar usuário',
            details: user.errors.full_messages 
          }, status: :unprocessable_entity
        end
      end

      def me
        render json: { user: user_data(@user) }
      end

      def logout
        # Implementar logout se necessário
        render json: { success: true }
      end

      def test_user
        user = User.find_by(email: 'admin@financialproject.com')
        render json: {
          direct_id: user.id,
          user_data: user_data(user),
          user_inspect: user.inspect
        }
      end

      def login_simple
        user = User.find_by(email: params[:email])
        
        if user&.valid_password?(params[:password])
          render json: {
            success: true,
            user: user_data(user),
            token: generate_token(user)
          }
        else
          render json: { 
            success: false, 
            error: 'Email ou senha inválidos' 
          }, status: :unauthorized
        end
      end

      def debug_user
        puts "=== DEBUG USER ==="
        puts "Email: admin@financialproject.com"
        
        # Testar consulta SQL direta
        sql = "SELECT id, email FROM users WHERE email = 'admin@financialproject.com'"
        puts "SQL: #{sql}"
        result = ActiveRecord::Base.connection.execute(sql)
        puts "Resultado: #{result.to_a}"
        
        # Testar find_by
        user = User.find_by(email: 'admin@financialproject.com')
        puts "find_by - ID: #{user&.id}, Email: #{user&.email}"
        
        # Testar where
        user2 = User.where(email: 'admin@financialproject.com').first
        puts "where - ID: #{user2&.id}, Email: #{user2&.email}"
        
        # Testar user_data
        user_data_result = user_data(user) if user
        puts "user_data - ID: #{user_data_result&.dig(:id)}"
        
        # Testar serialização JSON
        json_result = user_data_result.to_json
        puts "JSON: #{json_result}"
        
        render json: {
          sql_result: result.to_a,
          find_by_id: user&.id,
          where_id: user2&.id,
          user_data_id: user_data_result&.dig(:id),
          json_result: json_result
        }
      end

      def test_logs
        puts "=== TESTE DE LOGS ==="
        puts "Este é um teste de logs"
        puts "Timestamp: #{Time.current}"
        
        render json: { message: "Logs funcionando", timestamp: Time.current }
      end

      def create_test_user
        # Verificar se já existe um usuário admin
        existing_user = User.find_by(email: 'admin@procfy.io')
        
        if existing_user
          render json: { 
            success: true, 
            message: 'Usuário admin já existe',
            email: 'admin@procfy.io',
            password: 'password123'
          }
          return
        end

        # Criar conta padrão
        account = Account.create!(
          name: "Conta Principal",
          account_type: 'personal',
          default_currency: 'BRL'
        )

        # Criar usuário admin
        user = User.create!(
          email: 'admin@procfy.io',
          password: 'password123',
          password_confirmation: 'password123',
          first_name: 'Admin',
          last_name: 'Procfy'
        )

        # Associar usuário à conta
        user.accounts << account

        render json: { 
          success: true, 
          message: 'Usuário admin criado com sucesso',
          email: 'admin@procfy.io',
          password: 'password123'
        }
      rescue => e
        render json: { 
          success: false, 
          error: 'Erro ao criar usuário de teste',
          details: e.message
        }, status: :unprocessable_entity
      end

      private

      def set_user
        @user = current_user
      end

      def user_data(user)
        Rails.logger.info "user_data chamado com user ID: #{user.id}"
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          name: user.name,
          preferred_language: user.preferred_language
        }
      end

      def generate_token(user)
        # Gerar token simples baseado no ID do usuário
        # Em produção, use uma gem JWT como 'jwt' ou 'json-jwt'
        token_data = {
          user_id: user.id,
          email: user.email,
          exp: 24.hours.from_now.to_i
        }
        
        # Codificar em base64 para simplicidade
        Base64.strict_encode64(token_data.to_json)
      end

      def exchange_code_for_token(code)
        client_id = ENV['GOOGLE_CLIENT_ID']
        client_secret = ENV['GOOGLE_CLIENT_SECRET']
        redirect_uri = "#{request.base_url}/oauth/callback"

        uri = URI('https://oauth2.googleapis.com/token')
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/x-www-form-urlencoded'
        request.body = URI.encode_www_form({
          client_id: client_id,
          client_secret: client_secret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirect_uri
        })

        response = http.request(request)
        data = JSON.parse(response.body)

        if response.code == '200'
          { access_token: data['access_token'] }
        else
          { error: data['error_description'] || 'Erro ao trocar código por token' }
        end
      rescue => e
        { error: "Erro na comunicação com Google: #{e.message}" }
      end

      def get_google_user_info(access_token)
        uri = URI('https://www.googleapis.com/oauth2/v2/userinfo')
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        request = Net::HTTP::Get.new(uri)
        request['Authorization'] = "Bearer #{access_token}"

        response = http.request(request)
        data = JSON.parse(response.body)

        if response.code == '200'
          {
            provider: 'google_oauth2',
            uid: data['id'],
            email: data['email'],
            first_name: data['given_name'],
            last_name: data['family_name'],
            name: data['name']
          }
        else
          { error: 'Erro ao obter informações do usuário' }
        end
      rescue => e
        { error: "Erro na comunicação com Google: #{e.message}" }
      end
    end
  end
end 