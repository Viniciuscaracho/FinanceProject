# frozen_string_literal: true

module GoogleCalendar
  class CreateEvent < ApplicationService
    def call
      appointment = context.appointment
      account     = appointment.account

      client_result = GoogleCalendar::Client.call(account: account)
      return context.fail!(error: client_result.message) unless client_result.success?

      service     = client_result.service
      calendar_id = client_result.calendar_id

      event = build_event(appointment)
      create_options = {}
      create_options[:conference_data_version] = 1 if needs_meet_link?(appointment)

      created_event = service.insert_event(calendar_id, event, **create_options)

      updates = { google_calendar_event_id: created_event.id }

      if (meet_link = extract_meet_link(created_event))
        updates[:google_meet_link] = meet_link
      end

      appointment.update_columns(updates)
      context.event = created_event
    rescue Google::Apis::Error => e
      Rails.logger.error "GoogleCalendar::CreateEvent erro: #{e.message}"
      context.fail!(error: "Erro ao criar evento no Google Calendar: #{e.message}")
    end

    private

    def build_event(appointment)
      event = Google::Apis::CalendarV3::Event.new(
        summary:     "#{appointment.service.name} — #{appointment.client_name}",
        description: build_description(appointment),
        start:       event_datetime(appointment.start_time),
        end:         event_datetime(appointment.end_time),
        attendees:   build_attendees(appointment),
        reminders:   build_reminders
      )

      if needs_meet_link?(appointment)
        event.conference_data = Google::Apis::CalendarV3::ConferenceData.new(
          create_request: Google::Apis::CalendarV3::CreateConferenceRequest.new(
            request_id: SecureRandom.hex(8),
            conference_solution_key: Google::Apis::CalendarV3::ConferenceSolutionKey.new(type: 'hangoutsMeet')
          )
        )
      end

      event
    end

    def event_datetime(time)
      Google::Apis::CalendarV3::EventDateTime.new(
        date_time: time.iso8601,
        time_zone: 'America/Sao_Paulo'
      )
    end

    def build_reminders
      Google::Apis::CalendarV3::Event::Reminders.new(
        use_default: false,
        overrides: [
          Google::Apis::CalendarV3::EventReminder.new(reminder_method: 'email',  minutes: 1440),
          Google::Apis::CalendarV3::EventReminder.new(reminder_method: 'popup',  minutes: 60)
        ]
      )
    end

    def build_attendees(appointment)
      return [] if appointment.contact&.email.blank?

      [Google::Apis::CalendarV3::EventAttendee.new(email: appointment.contact.email)]
    end

    def build_description(appointment)
      professional_name = appointment.account_user.user.name rescue appointment.account_user_id.to_s
      [
        "Serviço: #{appointment.service.name}",
        "Profissional: #{professional_name}",
        "Cliente: #{appointment.client_name}",
        "WhatsApp: #{appointment.whatsapp_number}",
        "Valor: #{appointment.price.format(symbol: true)}"
      ].join("\n")
    end

    def needs_meet_link?(appointment)
      appointment.google_meet_link.blank?
    end

    def extract_meet_link(event)
      return nil unless event.conference_data&.entry_points

      entry = event.conference_data.entry_points.find { |ep| ep.entry_point_type == 'video' }
      entry&.uri
    end
  end
end
