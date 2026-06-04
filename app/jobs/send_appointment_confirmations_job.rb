# frozen_string_literal: true

# Runs after appointment creation: syncs Google Calendar (creates real Meet link),
# then sends WhatsApp notifications with the Meet link to both the patient and
# the professional/nutritionist.
class SendAppointmentConfirmationsJob < ApplicationJob
  include Appointments::NotificationHelpers

  queue_as :default

  retry_on Google::Apis::ServerError, Google::Apis::RateLimitError,
           Signet::AuthorizationError,
           wait: :exponentially_longer, attempts: 5

  def perform(appointment_id)
    appointment = Appointment.find_by(id: appointment_id)
    return unless appointment

    sync_google_calendar(appointment)
    appointment.reload

    send_patient_whatsapp(appointment)
    send_professional_whatsapp(appointment)
  end

  private

  def sync_google_calendar(appointment)
    return unless appointment.account.google_calendar_connected?

    GoogleCalendar::SyncAppointment.call(appointment: appointment)
  rescue => e
    Rails.logger.warn "SendAppointmentConfirmationsJob: calendar sync falhou (#{e.message})"
  end

  def send_patient_whatsapp(appointment)
    phone = appointment.whatsapp_number
    return if phone.blank?

    message = patient_message(appointment)
    send_whatsapp(account: appointment.account, phone: phone, message: message)
  rescue => e
    Rails.logger.error "SendAppointmentConfirmationsJob: WhatsApp paciente falhou (#{e.message})"
  end

  def send_professional_whatsapp(appointment)
    phone = appointment.account_user&.user&.phone_number
    return if phone.blank?

    message = professional_message(appointment)
    send_whatsapp(account: appointment.account, phone: phone, message: message)
  rescue => e
    Rails.logger.error "SendAppointmentConfirmationsJob: WhatsApp profissional falhou (#{e.message})"
  end

  def patient_message(appointment)
    prof_name    = appointment.account_user&.user&.first_name.presence || 'Profissional'
    service_name = appointment.service.name
    start_time   = format_time(appointment.start_time)
    company_name = appointment.account&.company&.name.presence ||
                   appointment.account&.company&.first_name.presence ||
                   'nossa equipe'

    msg  = "📋 *Agendamento Confirmado!*\n\n"
    msg += "Olá! Seu agendamento foi realizado com sucesso:\n\n"
    msg += "📅 *Data:* #{start_time}\n"
    msg += "👤 *Profissional:* #{prof_name}\n"
    msg += "💼 *Serviço:* #{service_name}\n"
    msg += "\n⏳ Aguardando confirmação de #{company_name}."

    if appointment.google_meet_link.present?
      msg += "\n\n🔗 *Link do Google Meet:*\n#{appointment.google_meet_link}"
    end

    if appointment.manage_url.present?
      hours = (appointment.appointment_link&.settings&.dig('cancel_reschedule_hours')&.to_i || 24).clamp(1, 720)
      msg += "\n\n⚙️ *Gerenciar agendamento* (cancele ou reagende até #{hours}h antes):\n#{appointment.manage_url}"
    end

    msg += "\n\nObrigado pela preferência! 🙏"
    msg
  end

  def professional_message(appointment)
    client_name  = appointment.contact&.name.presence || appointment.whatsapp_number || 'Paciente'
    service_name = appointment.service.name
    start_time   = format_time(appointment.start_time)

    msg  = "📅 *Novo Agendamento!*\n\n"
    msg += "Você tem um novo agendamento:\n\n"
    msg += "📅 *Data:* #{start_time}\n"
    msg += "👤 *Paciente:* #{client_name}\n"
    msg += "💼 *Serviço:* #{service_name}\n"

    if appointment.whatsapp_number.present?
      normalized = appointment.whatsapp_number.gsub(/\D/, '')
      normalized = "55#{normalized}" unless normalized.start_with?('55')
      msg += "📱 *WhatsApp do paciente:* https://wa.me/#{normalized}\n"
    end

    if appointment.google_meet_link.present?
      msg += "\n🔗 *Link do Google Meet:*\n#{appointment.google_meet_link}"
    end

    msg
  end
end
