# frozen_string_literal: true

class GoogleCalendarSyncJob < ApplicationJob
  queue_as :default

  def perform(appointment_id)
    appointment = Appointment.find_by(id: appointment_id)
    return unless appointment

    GoogleCalendar::SyncAppointment.call(appointment: appointment)
  rescue => e
    Rails.logger.error "GoogleCalendarSyncJob falhou para appointment ##{appointment_id}: #{e.message}"
  end
end
