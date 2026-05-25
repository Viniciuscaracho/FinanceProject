# frozen_string_literal: true

class GoogleCalendarSyncJob < ApplicationJob
  queue_as :default

  retry_on Google::Apis::ServerError, Google::Apis::RateLimitError,
           Signet::AuthorizationError,
           wait: :exponentially_longer, attempts: 5

  def perform(appointment_id)
    appointment = Appointment.find_by(id: appointment_id)
    return unless appointment

    GoogleCalendar::SyncAppointment.call(appointment: appointment)
  end
end
