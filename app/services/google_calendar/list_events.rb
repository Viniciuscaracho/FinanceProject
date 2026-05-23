# frozen_string_literal: true

module GoogleCalendar
  class ListEvents < ApplicationService
    def call
      account  = context.account
      time_min = context.time_min
      time_max = context.time_max

      return context.fail!(error: 'Google Calendar não está conectado') unless account.google_calendar_connected?

      client_result = GoogleCalendar::Client.call(account: account)
      return context.fail!(error: client_result.message) unless client_result.success?

      service     = client_result.service
      calendar_id = client_result.calendar_id

      response = service.list_events(
        calendar_id,
        time_min:       time_min.iso8601,
        time_max:       time_max.iso8601,
        single_events:  true,
        order_by:       'startTime'
      )

      # Exclude events already tracked as appointments in our system
      system_event_ids = Set.new(
        account.appointments
               .where.not(google_calendar_event_id: nil)
               .pluck(:google_calendar_event_id)
      )

      context.events = (response.items || [])
        .reject { |e| e.summary.blank? || system_event_ids.include?(e.id) }
        .map    { |e| serialize_event(e) }
    rescue Google::Apis::Error => e
      Rails.logger.error "GoogleCalendar::ListEvents erro: #{e.message}"
      context.fail!(error: "Erro ao listar eventos: #{e.message}")
    end

    private

    def serialize_event(event)
      start_dt = event.start&.date_time || event.start&.date
      end_dt   = event.end&.date_time   || event.end&.date

      {
        id:         event.id,
        title:      event.summary,
        start_time: start_dt,
        end_time:   end_dt,
        all_day:    event.start&.date_time.nil?,
        location:   event.location,
        source:     'google_calendar'
      }
    end
  end
end
