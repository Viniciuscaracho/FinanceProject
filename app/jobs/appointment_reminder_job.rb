# frozen_string_literal: true

class AppointmentReminderJob < ApplicationJob
  queue_as :default

  def perform
    appointments = Appointment
      .confirmed
      .needs_reminder
      .where('start_time > ? AND start_time <= ?', Time.current, 24.hours.from_now)

    count = 0
    appointments.find_each do |appointment|
      next unless appointment.contact.present?

      WhatsApp::EventHandler.call(
        account:  appointment.account,
        contact:  appointment.contact,
        event:    :appointment_reminder_24h,
        resource: appointment
      )

      # Atualiza flag para o scope não re-selecionar este agendamento
      appointment.update_columns(
        whatsapp_reminder_sent:    true,
        whatsapp_reminder_sent_at: Time.current
      )
      count += 1
    rescue StandardError => e
      Rails.logger.error "[AppointmentReminderJob] appointment ##{appointment.id}: #{e.message}"
    end

    Rails.logger.info "[AppointmentReminderJob] #{count} lembretes enfileirados"
  end
end
