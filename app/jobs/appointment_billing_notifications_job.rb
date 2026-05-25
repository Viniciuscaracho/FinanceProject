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

    run_via_event_handler(scope, :billing_notification, flag: :billing_notification_sent, label: 'cobrança pendente')
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

    run_via_event_handler(scope, :pix_reminder, flag: :pix_reminder_sent, label: 'lembrete PIX')
  end

  # Agendamentos confirmados que começam em 1h–2h (manual + link público)
  def process_1h_reminders
    scope = Appointment
      .confirmed
      .where(whatsapp_1h_reminder_sent: false)
      .where('start_time > ? AND start_time <= ?', 1.hour.from_now, 2.hours.from_now)

    count = 0
    scope.find_each do |appointment|
      next unless appointment.contact.present?

      # Para agendamentos com link: respeita a configuração de automação do link
      if appointment.appointment_link_id.present?
        settings = appointment.appointment_link&.settings || {}
        automations = settings['automations'] || {}
        next unless automations['reminder_1h'] == true
      end

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

    run_via_event_handler(scope, :overdue_notification, flag: :overdue_notification_sent, label: 'atraso')
  end

  # Roteia notificação pelo EventHandler (idempotência, cooldown, janela horária).
  # Marca a flag imediatamente ao enfileirar — não aguarda o envio assíncrono.
  def run_via_event_handler(scope, event, flag:, label:)
    sent_col = flag.to_s
    sent_at_col = "#{sent_col}_at"
    count = 0

    scope.includes(:contact, :account).find_each do |appointment|
      contact = appointment.contact
      unless contact&.cell_phone_number.present?
        Rails.logger.warn "⚠️  [#{label}] appointment ##{appointment.id} sem contato com telefone — pulado"
        next
      end

      WhatsApp::EventHandler.call(
        account:  appointment.account,
        contact:  contact,
        event:    event,
        resource: appointment
      )

      cols = { sent_col => true, sent_at_col => Time.current }
      appointment.update_columns(**cols)
      count += 1
      Rails.logger.info "✅ [#{label}] Enfileirado para appointment ##{appointment.id}"
    rescue StandardError => e
      Rails.logger.error "❌ [#{label}] Exceção no appointment ##{appointment.id}: #{e.message}"
    end

    Rails.logger.info "📨 [#{label}] #{count} mensagens enfileiradas"
  end
end
