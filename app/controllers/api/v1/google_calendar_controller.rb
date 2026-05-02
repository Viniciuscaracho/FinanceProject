# frozen_string_literal: true

module Api
  module V1
    class GoogleCalendarController < ApplicationController
      CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'

      skip_before_action :authenticate_user!, only: [:callback]
      skip_before_action :set_current_account, only: [:callback]
      skip_before_action :create_or_refresh_session, only: [:callback]

      # GET /api/v1/google_calendar/status
      def status
        account = Current.account
        render json: {
          connected:  account.google_calendar_connected?,
          calendar_id: account.google_calendar_id
        }
      end

      # GET /api/v1/google_calendar/oauth_url
      # Retorna a URL de autorização do Google Calendar para a conta atual.
      def oauth_url
        account  = Current.account
        state    = build_state(account)

        url = build_oauth_url(state)
        render json: { oauth_url: url }
      end

      # GET /api/v1/google_calendar/callback
      # Google redireciona aqui após o usuário autorizar.
      def callback
        code  = params[:code]
        state = params[:state]

        if code.blank?
          return redirect_to "#{frontend_url}/configuracoes?google_calendar=error&reason=no_code"
        end

        account = decode_state(state)
        if account.nil?
          return redirect_to "#{frontend_url}/configuracoes?google_calendar=error&reason=invalid_state"
        end

        token_data = exchange_code(code)
        if token_data[:error]
          return redirect_to "#{frontend_url}/configuracoes?google_calendar=error&reason=token_exchange"
        end

        account.update_columns(
          google_access_token:     token_data[:access_token],
          google_refresh_token:    token_data[:refresh_token],
          google_token_expires_at: token_data[:expires_at],
          google_calendar_connected: true
        )

        redirect_to "#{frontend_url}/configuracoes?google_calendar=connected"
      end

      # DELETE /api/v1/google_calendar/disconnect
      def disconnect
        Current.account.update_columns(
          google_access_token:     nil,
          google_refresh_token:    nil,
          google_token_expires_at: nil,
          google_calendar_connected: false
        )

        render json: { success: true, message: 'Google Calendar desconectado com sucesso' }
      end

      # POST /api/v1/google_calendar/sync
      # Dispara a sincronização de todos os agendamentos futuros da conta.
      def sync
        account = Current.account

        unless account.google_calendar_connected?
          return render json: { error: 'Google Calendar não está conectado' }, status: :unprocessable_entity
        end

        appointments = account.appointments
                              .where('start_time >= ?', Time.current)
                              .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])

        appointments.find_each do |appointment|
          GoogleCalendarSyncJob.perform_later(appointment.id)
        end

        render json: {
          success: true,
          message: "Sincronização iniciada para #{appointments.count} agendamento(s)"
        }
      end

      private

      def build_oauth_url(state)
        "https://accounts.google.com/o/oauth2/v2/auth?" + URI.encode_www_form(
          client_id:     ENV.fetch('GOOGLE_CLIENT_ID'),
          redirect_uri:  calendar_callback_url,
          scope:         CALENDAR_SCOPE,
          response_type: 'code',
          access_type:   'offline',
          prompt:        'consent',
          state:         state
        )
      end

      def calendar_callback_url
        "#{request.base_url}/api/v1/google_calendar/callback"
      end

      def build_state(account)
        payload = { account_id: account.id, exp: 10.minutes.from_now.to_i }
        JWT.encode(payload, jwt_secret, 'HS256')
      end

      def decode_state(state)
        return nil if state.blank?

        payload = JWT.decode(state, jwt_secret, true, algorithm: 'HS256').first
        Account.find_by(id: payload['account_id'])
      rescue JWT::DecodeError
        nil
      end

      def exchange_code(code)
        response = HTTParty.post(
          'https://oauth2.googleapis.com/token',
          body: {
            code:          code,
            client_id:     ENV.fetch('GOOGLE_CLIENT_ID'),
            client_secret: ENV.fetch('GOOGLE_CLIENT_SECRET'),
            redirect_uri:  calendar_callback_url,
            grant_type:    'authorization_code'
          }
        )

        body = response.parsed_response
        return { error: body['error_description'] || body['error'] } if body['error']

        {
          access_token:  body['access_token'],
          refresh_token: body['refresh_token'],
          expires_at:    Time.current + body['expires_in'].to_i.seconds
        }
      rescue => e
        { error: e.message }
      end

      def jwt_secret
        Rails.application.secret_key_base
      end

      def frontend_url
        ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
      end
    end
  end
end
