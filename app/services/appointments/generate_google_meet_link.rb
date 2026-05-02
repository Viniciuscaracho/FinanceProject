# frozen_string_literal: true

module Appointments
  # Gera um link do Google Meet para um agendamento.
  # Se a conta tiver o Google Calendar conectado, cria um evento real na API
  # do Calendar (que gera um Meet autêntico).
  # Caso contrário, usa o link estático configurado ou gera um código aleatório.
  class GenerateGoogleMeetLink < ApplicationService
    MEET_BASE_URL = 'https://meet.google.com'

    def call
      appointment = context.appointment
      return context.fail!(error: 'Appointment is required') unless appointment

      if appointment.google_meet_link.present?
        context.google_meet_link = appointment.google_meet_link
        return
      end

      # Tentar via Google Calendar API (link autêntico)
      if appointment.account.google_calendar_connected?
        result = create_via_calendar_api(appointment)
        if result
          context.google_meet_link = result
          return
        end
      end

      # Fallback: link estático via ENV
      if (static_link = configured_static_link)
        appointment.update_columns(google_meet_link: static_link)
        context.google_meet_link = static_link
        return
      end

      # Último recurso: código aleatório no formato do Meet
      meet_link = "#{MEET_BASE_URL}/#{generate_meet_code}"
      appointment.update_columns(google_meet_link: meet_link)
      context.google_meet_link = meet_link
    end

    private

    def create_via_calendar_api(appointment)
      if appointment.google_calendar_event_id.present?
        # Evento já existe — buscar o link Meet dele
        fetch_meet_from_existing_event(appointment)
      else
        # Criar evento com conferenceData para obter link real
        result = GoogleCalendar::CreateEvent.call(appointment: appointment)
        appointment.reload.google_meet_link if result.success?
      end
    rescue => e
      Rails.logger.warn "Appointments::GenerateGoogleMeetLink via API falhou: #{e.message}"
      nil
    end

    def fetch_meet_from_existing_event(appointment)
      client_result = GoogleCalendar::Client.call(account: appointment.account)
      return nil unless client_result.success?

      event = client_result.service.get_event(
        client_result.calendar_id,
        appointment.google_calendar_event_id
      )

      entry = event.conference_data&.entry_points&.find { |ep| ep.entry_point_type == 'video' }
      return nil unless entry

      appointment.update_columns(google_meet_link: entry.uri)
      entry.uri
    rescue Google::Apis::Error
      nil
    end

    def configured_static_link
      link = ENV['GOOGLE_MEET_STATIC_LINK'] || ENV['DEFAULT_GOOGLE_MEET_LINK']
      return nil if link.blank?

      sanitized = link.strip
      return sanitized if sanitized.start_with?('http') && sanitized.include?('meet.google.com')

      nil
    end

    def generate_meet_code
      letters = ('a'..'z').to_a
      raw = Array.new(10) { letters.sample }.join
      "#{raw[0..2]}-#{raw[3..6]}-#{raw[7..9]}"
    end
  end
end
