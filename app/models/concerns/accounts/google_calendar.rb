# frozen_string_literal: true

module Accounts
  module GoogleCalendar
    extend ActiveSupport::Concern

    included do
      # Garante que o calendar_id padrão é sempre 'primary'
      before_save :set_default_calendar_id
    end

    def google_calendar_connected?
      google_calendar_connected == true &&
        google_access_token.present? &&
        google_refresh_token.present?
    end

    def disconnect_google_calendar!
      update_columns(
        google_access_token:       nil,
        google_refresh_token:      nil,
        google_token_expires_at:   nil,
        google_calendar_connected: false
      )
    end

    private

    def set_default_calendar_id
      self.google_calendar_id = 'primary' if google_calendar_id.blank?
    end
  end
end
