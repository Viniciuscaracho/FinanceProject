# frozen_string_literal: true

module Api
  module V1
    class AuthController < Api::V1::ApplicationController
      skip_before_action :authenticate_user!, only: [:login, :login_simple, :google_oauth_url, :google_oauth_callback, :firebase_login, :supabase_login, :register]
      skip_before_action :set_current_account, only: [:login, :login_simple, :google_oauth_url, :google_oauth_callback, :firebase_login, :supabase_login, :register]
      skip_before_action :create_or_refresh_session, only: [:login, :login_simple, :google_oauth_url, :google_oauth_callback, :firebase_login, :supabase_login, :register]
      before_action :set_user, only: [:me, :logout]
      before_action :force_json_format

      rescue_from StandardError, with: :handle_error

      def force_json_format
        request.format = :json
      end

      def handle_error(exception)
        Rails.logger.error "=== Erro em AuthController ==="
        Rails.logger.error "Exception: #{exception.class.name}"
        Rails.logger.error "Message: #{exception.message}"
        Rails.logger.error exception.backtrace.first(10).join("\n")

        return if performed?

        render json: {
          success: false,
          error: Rails.env.development? ? "Erro interno do servidor: #{exception.message}" : "Erro interno do servidor",
          details: Rails.env.development? ? exception.backtrace.first(10) : nil
        }, status: :internal_server_error
      end

      def login
        user = User.where(email: params[:email]).first

        return render json: { success: false, error: 'Email ou senha inválidos' }, status: :unauthorized unless user

        if user.provider.present?
          return render json: {
            success: false,
            error: 'Este usuário foi criado via autenticação social. Use o login via ' + user.provider.capitalize + ' ou redefina sua senha.',
            oauth_user: true,
            provider: user.provider
          }, status: :unauthorized
        end

        if user.valid_password?(params[:password])
          render json: { success: true, user: user_data(user), token: generate_token(user) }
        else
          render json: { success: false, error: 'Email ou senha inválidos' }, status: :unauthorized
        end
      end

      def firebase_login
        data = params.permit(:uid, :email, :name, :photo_url, :provider)
        user = User.find_or_initialize_by(uid: data[:uid])

        if user.new_record?
          user.email = data[:email]
          user.first_name = data[:name]&.split(' ')&.first || ''
          user.last_name = data[:name]&.split(' ')&.last || ''
          user.provider = data[:provider] || 'firebase'
          user.password = Devise.friendly_token[0, 20]

          if user.accounts.empty?
            account = Account.create!(name: "Conta Principal", account_type: 'personal', default_currency: 'BRL')
            user.accounts << account
          end

          return render json: { success: false, error: 'Erro ao criar usuário', details: user.errors.full_messages }, status: :unprocessable_entity unless user.save
        else
          user.update(
            email: data[:email],
            first_name: data[:name]&.split(' ')&.first || user.first_name,
            last_name: data[:name]&.split(' ')&.last || user.last_name
          )
        end

        sign_in user

        render json: { success: true, user: user_data(user), token: generate_token(user) }
      rescue => e
        Rails.logger.error "Firebase login error: #{e.class}: #{e.message}"
        render json: { success: false, error: 'Erro interno do servidor' }, status: :internal_server_error
      end

      def supabase_login
        access_token = params[:access_token] || request.headers['Authorization']&.gsub(/^Bearer /, '')

        return render json: { success: false, error: 'Token de acesso não fornecido' }, status: :unauthorized unless access_token.present?

        user = Supabase::Auth.get_user_from_token(access_token)

        return render json: { success: false, error: 'Token inválido ou expirado' }, status: :unauthorized unless user

        token = Supabase::Auth.generate_access_token(user)

        render json: { success: true, user: user_data(user), token: token, supabase_token: access_token }
      rescue => e
        render json: { success: false, error: 'Erro interno do servidor' }, status: :internal_server_error
      end

      def google_oauth_url
        redirect_uri = "#{request.base_url}/api/v1/auth/google_oauth_callback"
        render json: {
          auth_url: "https://accounts.google.com/o/oauth2/v2/auth?" + URI.encode_www_form(
            client_id:     ENV.fetch('GOOGLE_CLIENT_ID', ''),
            redirect_uri:  redirect_uri,
            scope:         'openid email profile',
            response_type: 'code',
            access_type:   'offline',
            prompt:        'consent'
          )
        }
      end

      def google_oauth_callback
        return redirect_to "#{frontend_url}/auth/google?error=no_code", allow_other_host: true if params[:code].blank?

        token_response = exchange_code_for_token(params[:code])
        return redirect_to "#{frontend_url}/auth/google?error=token_exchange", allow_other_host: true if token_response[:error]

        user_info = get_google_user_info(token_response[:access_token])
        return redirect_to "#{frontend_url}/auth/google?error=user_info", allow_other_host: true if user_info[:error]

        user = User.from_omniauth_data(user_info)

        if user.persisted?
          redirect_to "#{frontend_url}/auth/google?token=#{CGI.escape(generate_token(user))}", allow_other_host: true
        else
          error_msg = CGI.escape(user.errors.full_messages.join(', '))
          redirect_to "#{frontend_url}/auth/google?error=#{error_msg}", allow_other_host: true
        end
      end

      def me
        return render json: { error: 'Usuário não encontrado' }, status: :unauthorized unless @user

        render json: { user: user_data(@user) }
      rescue => e
        Rails.logger.error "me action error: #{e.class}: #{e.message}"
        render json: { error: "Erro ao obter dados do usuário" }, status: :internal_server_error
      end

      def logout
        render json: { success: true, message: 'Logout realizado com sucesso' }
      end

      def login_simple
        user = User.find_by(email: params[:email])

        return render json: { success: false, error: 'Email ou senha inválidos' }, status: :unauthorized unless user

        if user.provider.present?
          return render json: {
            success: false,
            error: 'Este usuário foi criado via autenticação social. Use o login via ' + user.provider.capitalize + ' ou redefina sua senha.',
            oauth_user: true,
            provider: user.provider
          }, status: :unauthorized
        end

        return render json: { success: false, error: 'Email ou senha inválidos' }, status: :unauthorized unless user.valid_password?(params[:password])

        render json: { success: true, user: user_data(user), token: generate_token(user) }
      rescue => e
        Rails.logger.error "login_simple error: #{e.class}: #{e.message}"
        return if performed?
        render json: { success: false, error: 'Erro ao processar login' }, status: :internal_server_error
      end

      def register
        email = params[:email].to_s.strip.downcase
        password = params[:password].to_s
        full_name = params[:name].to_s.strip
        account_name = params[:account_name].to_s.strip.presence || full_name
        document = params[:document].to_s.strip.presence

        return render json: { success: false, error: 'Preencha todos os campos obrigatórios' }, status: :unprocessable_entity if email.blank? || password.blank? || full_name.blank?
        return render json: { success: false, error: 'Este e-mail já está cadastrado' }, status: :unprocessable_entity if User.exists?(email: email)

        first_name, last_name = full_name.split(' ', 2).then { |parts| [parts[0], parts[1].to_s] }

        return render json: { success: false, error: 'Nome deve ter pelo menos 3 caracteres' }, status: :unprocessable_entity if first_name.length < 3

        ActiveRecord::Base.transaction do
          user = User.new(
            email: email,
            password: password,
            password_confirmation: password,
            first_name: first_name,
            last_name: last_name,
            accepted_terms_at: Time.current,
            accepted_privacy_at: Time.current
          )
          user.skip_confirmation!
          user.save!

          account = user.account
          if account&.company
            company_attrs = { first_name: account_name, last_name: nil }
            company_attrs[:document_1] = document if document.present?
            account.company.update_columns(**company_attrs)
          end

          Current.user = user
          Current.account = account

          render json: { success: true, user: user_data(user), token: generate_token(user) }
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { success: false, error: e.record.errors.full_messages.first || 'Erro ao criar conta' }, status: :unprocessable_entity
      rescue => e
        Rails.logger.error "Register error: #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        render json: { success: false, error: "Erro interno ao criar conta. Tente novamente." }, status: :internal_server_error
      end

      private

      def set_user
        @user = current_user
      end

      def user_data(user)
        Current.user = user unless Current.user == user

        account = if Current.account.present?
                    Current.account
                  elsif user.account.present?
                    user.account
                  elsif user.accounts.any?
                    user.accounts.first
                  end

        Current.account = account if account.present? && Current.account != account

        is_account_admin = false
        is_account_owner = false
        if account
          account_user = user.current_account_user
          is_account_admin = account_user&.admin? || false
          is_account_owner = user.current_account_owner? || false
        end

        account_data = if account
                         {
                           id: account.id,
                           prefix_id: account.prefix_id,
                           name: account.name,
                           admin: account.admin == true,
                           account_type: account.account_type
                         }
                       end

        {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          name: user.name || '',
          preferred_language: user.preferred_language,
          admin: user.admin? || false,
          account_admin: is_account_admin,
          account_owner: is_account_owner,
          account_user_id: account_user&.id,
          role: account_user&.role,
          account: account_data
        }
      rescue => e
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          name: user.name || '',
          preferred_language: user.preferred_language,
          admin: false,
          account_admin: false,
          account_owner: false,
          account: nil
        }
      end

      def generate_token(user)
        Base64.strict_encode64({ user_id: user.id, email: user.email, exp: 24.hours.from_now.to_i }.to_json)
      end

      def exchange_code_for_token(code)
        redirect_uri = "#{request.base_url}/api/v1/auth/google_oauth_callback"

        uri = URI('https://oauth2.googleapis.com/token')
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        http_request = Net::HTTP::Post.new(uri)
        http_request['Content-Type'] = 'application/x-www-form-urlencoded'
        http_request.body = URI.encode_www_form({
          client_id:     ENV['GOOGLE_CLIENT_ID'],
          client_secret: ENV['GOOGLE_CLIENT_SECRET'],
          code:          code,
          grant_type:    'authorization_code',
          redirect_uri:  redirect_uri
        })

        response = http.request(http_request)
        data = JSON.parse(response.body)

        response.code == '200' ? { access_token: data['access_token'] } : { error: data['error_description'] || 'Erro ao trocar código por token' }
      rescue => e
        { error: "Erro na comunicação com Google: #{e.message}" }
      end

      def frontend_url
        ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
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
          { provider: 'google_oauth2', uid: data['id'], email: data['email'], first_name: data['given_name'], last_name: data['family_name'], name: data['name'] }
        else
          { error: 'Erro ao obter informações do usuário' }
        end
      rescue => e
        { error: "Erro na comunicação com Google: #{e.message}" }
      end
    end
  end
end
