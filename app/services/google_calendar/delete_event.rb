# frozen_string_literal: true

module GoogleCalendar
  class DeleteEvent < ApplicationService
    def call
      appointment = context.appointment
      account     = appointment.account

      return unless appointment.google_calendar_event_id.present?

      client_result = GoogleCalendar::Client.call(account: account)
      return context.fail!(error: client_result.message) unless client_result.success?

      service     = client_result.service
      calendar_id = client_result.calendar_id

      service.delete_event(calendar_id, appointment.google_calendar_event_id)
      appointment.update_columns(google_calendar_event_id: nil)
    rescue Google::Apis::ClientError => e
      # 404 = já foi deletado; ignorar silenciosamente
      raise unless e.status_code == 404

      appointment.update_columns(google_calendar_event_id: nil)
    rescue Google::Apis::Error => e
      Rails.logger.error "GoogleCalendar::DeleteEvent erro: #{e.message}"
      context.fail!(error: "Erro ao deletar evento no Google Calendar: #{e.message}")
    end
  end
end
