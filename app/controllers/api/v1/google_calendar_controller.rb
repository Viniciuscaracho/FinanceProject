# frozen_string_literal: true

module Api
  module V1
    class GoogleCalendarController < ApplicationController
      CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'

      skip_before_action :authenticate_user!,        only: [:callback]
      skip_before_action :set_current_account,       only: [:callback]
      skip_before_action :create_or_refresh_session, only: [:callback]

      def status
        render json: {
          connected:   Current.account.google_calendar_connected?,
          calendar_id: Current.account.google_calendar_id
        }
      end

      def oauth_url
        state = build_state(Current.account)
        render json: { oauth_url: build_oauth_url(state) }
      end

      def callback
        return redirect_to "#{frontend_url}/settings?google_calendar=error&reason=no_code" if params[:code].blank?

        account = decode_state(params[:state])
        return redirect_to "#{frontend_url}/settings?google_calendar=error&reason=invalid_state" if account.nil?

        token_data = exchange_code(params[:code])
        return redirect_to "#{frontend_url}/settings?google_calendar=error&reason=token_exchange" if token_data[:error]

        account.update_columns(
          google_access_token:       token_data[:access_token],
          google_refresh_token:      token_data[:refresh_token],
          google_token_expires_at:   token_data[:expires_at],
          google_calendar_connected: true
        )

        redirect_to "#{frontend_url}/settings?google_calendar=connected"
      end

      def disconnect
        Current.account.update_columns(
          google_access_token:       nil,
          google_refresh_token:      nil,
          google_token_expires_at:   nil,
          google_calendar_connected: false
        )

        render json: { success: true, message: 'Google Calendar desconectado com sucesso' }
      end

      def events
        time_min = Time.zone.parse(params[:start]) rescue 1.week.ago
        time_max = Time.zone.parse(params[:end])   rescue 1.week.from_now

        result = GoogleCalendar::ListEvents.call(
          account:  Current.account,
          time_min: time_min,
          time_max: time_max
        )

        if result.success?
          render json: { events: result.events }
        else
          render json: { events: [], error: result.message }, status: :ok
        end
      end

      def sync
        account = Current.account
        return render json: { error: 'Google Calendar não está conectado' }, status: :unprocessable_entity unless account.google_calendar_connected?

        appointments = account.appointments
                              .where('start_time >= ?', Time.current)
                              .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])

        appointments.find_each { |appointment| GoogleCalendarSyncJob.perform_later(appointment.id) }

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
        "#{ENV.fetch('API_BASE_URL', request.base_url)}/api/v1/google_calendar/callback"
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
