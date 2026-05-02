# frozen_string_literal: true

class AppointmentReminderJob < ApplicationJob
  queue_as :default

  def perform
    # Buscar agendamentos que precisam de lembrete
    # Enviar lembretes para agendamentos confirmados que acontecem nas próximas 24 horas
    appointments = Appointment
      .confirmed
      .needs_reminder
      .where('start_time > ? AND start_time <= ?', Time.current, 24.hours.from_now)
    
    appointments.find_each do |appointment|
      begin
        result = Appointments::SendWhatsappReminder.call(appointment: appointment)
        
        if result.success?
          Rails.logger.info "✅ Lembrete enviado para agendamento #{appointment.id}"
        else
          Rails.logger.error "❌ Erro ao enviar lembrete para agendamento #{appointment.id}: #{result.error}"
        end
      rescue => e
        Rails.logger.error "❌ Exceção ao enviar lembrete para agendamento #{appointment.id}: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
      end
    end
    
    Rails.logger.info "📧 Processados #{appointments.count} lembretes de agendamento"
  end
end


