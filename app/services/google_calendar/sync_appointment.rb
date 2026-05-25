# frozen_string_literal: true

module GoogleCalendar
  # Orquestra a sincronização de um agendamento com o Google Calendar.
  # Decide automaticamente entre criar, atualizar ou deletar o evento.
  class SyncAppointment < ApplicationService
    def call
      appointment = context.appointment

      unless appointment.account.google_calendar_connected?
        return # Silencioso: conta sem Calendar conectado
      end

      if canceled?(appointment)
        GoogleCalendar::DeleteEvent.call(appointment: appointment)
      elsif appointment.google_calendar_event_id.present?
        GoogleCalendar::UpdateEvent.call(appointment: appointment)
      else
        GoogleCalendar::CreateEvent.call(appointment: appointment)
      end
    end

    private

    def canceled?(appointment)
      status = appointment.status
      status == :canceled || status == 'canceled' ||
        status == Appointment::APPOINTMENT_STATUS[:canceled]
    end
  end
end
