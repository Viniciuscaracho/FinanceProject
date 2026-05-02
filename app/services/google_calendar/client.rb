# frozen_string_literal: true

module GoogleCalendar
  class Client < ApplicationService
    CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'

    def call
      account = context.account
      return context.fail!(error: 'Google Calendar não está conectado para esta conta') unless account.google_calendar_connected?

      service = Google::Apis::CalendarV3::CalendarService.new
      service.client_options.application_name = 'BarberManagement'
      service.authorization = build_credentials(account)

      context.service     = service
      context.calendar_id = account.google_calendar_id.presence || 'primary'
    end

    private

    def build_credentials(account)
      credentials = Google::Auth::UserRefreshCredentials.new(
        client_id:     ENV.fetch('GOOGLE_CLIENT_ID'),
        client_secret: ENV.fetch('GOOGLE_CLIENT_SECRET'),
        scope:         CALENDAR_SCOPE,
        access_token:  account.google_access_token,
        refresh_token: account.google_refresh_token,
        expires_at:    account.google_token_expires_at
      )

      if credentials.expires_at.nil? || credentials.expires_at < Time.current + 60.seconds
        credentials.refresh!
        account.update_columns(
          google_access_token:     credentials.access_token,
          google_token_expires_at: credentials.expires_at
        )
      end

      credentials
    end
  end
end
