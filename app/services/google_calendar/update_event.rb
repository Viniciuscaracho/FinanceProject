# frozen_string_literal: true

module GoogleCalendar
  class UpdateEvent < ApplicationService
    def call
      appointment = context.appointment
      account     = appointment.account

      return unless appointment.google_calendar_event_id.present?

      client_result = GoogleCalendar::Client.call(account: account)
      return context.fail!(error: client_result.message) unless client_result.success?

      service     = client_result.service
      calendar_id = client_result.calendar_id

      event = build_updated_event(appointment)
      updated_event = service.update_event(calendar_id, appointment.google_calendar_event_id, event)

      context.event = updated_event
    rescue Google::Apis::ClientError => e
      # Evento deletado no Google Calendar manualmente — recriar
      if e.status_code == 404
        appointment.update_columns(google_calendar_event_id: nil)
        GoogleCalendar::CreateEvent.call(appointment: appointment)
      else
        Rails.logger.error "GoogleCalendar::UpdateEvent erro: #{e.message}"
        context.fail!(error: "Erro ao atualizar evento no Google Calendar: #{e.message}")
      end
    rescue Google::Apis::Error => e
      Rails.logger.error "GoogleCalendar::UpdateEvent erro: #{e.message}"
      context.fail!(error: "Erro ao atualizar evento no Google Calendar: #{e.message}")
    end

    private

    def build_updated_event(appointment)
      professional_name = appointment.account_user.user.name rescue appointment.account_user_id.to_s

      Google::Apis::CalendarV3::Event.new(
        summary:     "#{appointment.service.name} — #{appointment.client_name}",
        description: [
          "Serviço: #{appointment.service.name}",
          "Profissional: #{professional_name}",
          "Cliente: #{appointment.client_name}",
          "WhatsApp: #{appointment.whatsapp_number}",
          "Valor: #{appointment.price.format(symbol: true)}",
          "Status: #{appointment.status}"
        ].join("\n"),
        start: Google::Apis::CalendarV3::EventDateTime.new(
          date_time: appointment.start_time.iso8601,
          time_zone: 'America/Sao_Paulo'
        ),
        end: Google::Apis::CalendarV3::EventDateTime.new(
          date_time: appointment.end_time.iso8601,
          time_zone: 'America/Sao_Paulo'
        )
      )
    end
  end
end
