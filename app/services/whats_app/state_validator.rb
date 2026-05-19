# frozen_string_literal: true

module WhatsApp
  class StateValidator
    def self.valid?(event_type, resource)
      return true if resource.nil?

      case event_type.to_sym
      when :appointment_confirmation, :appointment_reminder_24h, :appointment_reminder_1h, :form_pending
        appointment_schedulable?(resource)
      when :payment_link
        payment_pending?(resource)
      when :payment_confirmed
        payment_paid?(resource)
      else
        true
      end
    end

    def self.appointment_schedulable?(appointment)
      return false unless appointment.respond_to?(:status)
      status = appointment.status
      status == :confirmed || status == Appointment::APPOINTMENT_STATUS[:confirmed] ||
        status == :pending   || status == Appointment::APPOINTMENT_STATUS[:pending]
    end

    def self.payment_pending?(resource)
      return true unless resource.respond_to?(:payment_status)
      resource.payment_status.to_s.in?(%w[pending unpaid])
    end

    def self.payment_paid?(resource)
      return true unless resource.respond_to?(:payment_status)
      resource.payment_status.to_s.in?(%w[paid completed])
    end
  end
end
