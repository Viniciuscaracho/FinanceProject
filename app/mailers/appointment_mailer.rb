# frozen_string_literal: true

class AppointmentMailer < ApplicationMailer
  def confirmation(appointment)
    @appointment     = appointment
    @client_name     = appointment.contact&.name.presence || 'Cliente'
    @service_name    = appointment.service&.name
    @professional_name = appointment.account_user&.user&.first_name.presence ||
                         appointment.account_user&.user&.name.presence || 'Profissional'
    @date            = I18n.l(appointment.start_time.to_date, format: :long, locale: :pt_BR) rescue appointment.start_time.strftime('%d/%m/%Y')
    @time            = appointment.start_time.strftime('%H:%M')
    @google_meet_link = appointment.google_meet_link
    @manage_url      = appointment.manage_url
    @cancel_reschedule_hours = appointment.appointment_link&.settings&.dig('cancel_reschedule_hours')&.to_i&.clamp(1, 720) || 24
    @company_name    = appointment.account&.company&.name.presence ||
                       appointment.account&.company&.first_name
    @company_whatsapp = normalize_whatsapp(appointment.account&.company&.cell_phone_number.presence ||
                                           appointment.account&.company&.phone_number)

    to_email = appointment.contact&.email
    return unless to_email.present?

    mail(
      to:      email_address_with_name(to_email, @client_name),
      subject: "Agendamento confirmado: #{@service_name} em #{appointment.start_time.strftime('%d/%m às %H:%M')}"
    )
  end

  private

  def normalize_whatsapp(number)
    return nil if number.blank?
    n = number.gsub(/\D/, '')
    n.start_with?('55') ? n : "55#{n}"
  end
end
