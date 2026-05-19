# frozen_string_literal: true

# Processa automações de cobrança/notificação para agendamentos.
# Rodado a cada hora pelo Sidekiq Scheduler.
#
# Automações por janela temporal:
#   - billing_notification : logo após a confirmação (até 2h depois)
#   - pix_reminder         : 24h antes do agendamento
#   - 1h reminder          : 1h–2h antes do agendamento
#   - overdue              : até 48h após o agendamento não pago
class AppointmentBillingNotificationsJob < ApplicationJob
  queue_as :default

  def perform
    process_billing_notifications
    process_pix_reminders
    process_1h_reminders
    process_overdue_notifications
  end

  private

  # Agendamentos confirmados + pagamento pendente + confirmados nas últimas 2h
  def process_billing_notifications
    scope = Appointment
      .confirmed
      .where(billing_notification_sent: false, payment_status: Appointment::PAYMENT_STATUS[:pending])
      .where('updated_at >= ?', 2.hours.ago)
      .joins(:appointment_link)
      .where("appointment_links.settings->'automations'->>'billing_notification' = 'true'")

    run_service(scope, Appointments::SendBillingNotification, 'cobrança pendente')
  end

  # Agendamentos confirmados + pagamento pendente + começam em 24h–25h
  def process_pix_reminders
    scope = Appointment
      .confirmed
      .where(pix_reminder_sent: false, payment_status: Appointment::PAYMENT_STATUS[:pending])
      .where('start_time > ? AND start_time <= ?', 24.hours.from_now, 25.hours.from_now)
      .joins(:appointment_link)
      .where("appointment_links.settings->'automations'->>'pix_reminder' = 'true'")
      .where("appointment_links.settings->'automations'->>'pix_key' IS NOT NULL")
      .where("appointment_links.settings->'automations'->>'pix_key' != ''")

    run_service(scope, Appointments::SendPixReminder, 'lembrete PIX')
  end

  # Agendamentos confirmados que começam em 1h–2h
  def process_1h_reminders
    scope = Appointment
      .confirmed
      .where(whatsapp_1h_reminder_sent: false)
      .where('start_time > ? AND start_time <= ?', 1.hour.from_now, 2.hours.from_now)
      .joins(:appointment_link)
      .where("appointment_links.settings->'automations'->>'reminder_1h' = 'true'")

    count = 0
    scope.find_each do |appointment|
      next unless appointment.contact.present?

      WhatsApp::EventHandler.call(
        account:  appointment.account,
        contact:  appointment.contact,
        event:    :appointment_reminder_1h,
        resource: appointment
      )

      appointment.update_columns(
        whatsapp_1h_reminder_sent:    true,
        whatsapp_1h_reminder_sent_at: Time.current
      )
      count += 1
    rescue StandardError => e
      Rails.logger.error "[AppointmentBillingNotificationsJob 1h] ##{appointment.id}: #{e.message}"
    end
    Rails.logger.info "📨 [lembrete 1h] #{count} mensagens enfileiradas"
  end

  # Agendamentos já passados + pagamento pendente + até 48h atrás
  def process_overdue_notifications
    scope = Appointment
      .where(overdue_notification_sent: false, payment_status: Appointment::PAYMENT_STATUS[:pending])
      .where('start_time < ? AND start_time >= ?', Time.current, 48.hours.ago)
      .joins(:appointment_link)
      .where("appointment_links.settings->'automations'->>'overdue' = 'true'")

    run_service(scope, Appointments::SendOverdueNotification, 'atraso')
  end

  def run_service(scope, service_class, label)
    count = 0
    scope.find_each do |appointment|
      result = service_class.call(appointment: appointment)
      if result.success?
        count += 1
        Rails.logger.info "✅ [#{label}] Enviado para appointment ##{appointment.id}"
      else
        Rails.logger.warn "⚠️  [#{label}] Pulado appointment ##{appointment.id}: #{result.error}"
      end
    rescue StandardError => e
      Rails.logger.error "❌ [#{label}] Exceção no appointment ##{appointment.id}: #{e.message}"
    end
    Rails.logger.info "📨 [#{label}] #{count} mensagens enviadas"
  end
end
