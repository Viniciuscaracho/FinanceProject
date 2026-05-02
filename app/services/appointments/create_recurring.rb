# frozen_string_literal: true

module Appointments
  class CreateRecurring < ApplicationService
    RECURRENCE_FREQUENCIES = {
      daily: 1.day,
      weekly: 1.week,
      biweekly: 2.weeks,
      monthly: 1.month,
      bimonthly: 2.months,
      quarterly: 3.months,
      semiannual: 6.months,
      annual: 1.year
    }.freeze

    def call
      parent_appointment = context.parent_appointment
      recurrence_pattern = context.recurrence_pattern || {}
      
      return context.fail!(error: 'Parent appointment is required') unless parent_appointment
      return context.fail!(error: 'Recurrence pattern is required') unless recurrence_pattern.is_a?(Hash)
      
      frequency = recurrence_pattern['frequency']&.to_sym
      occurrences = recurrence_pattern['occurrences']&.to_i || 10 # Padrão: 10 ocorrências
      end_date = recurrence_pattern['end_date'] ? Date.parse(recurrence_pattern['end_date']) : nil
      
      return context.fail!(error: 'Invalid frequency') unless RECURRENCE_FREQUENCIES.key?(frequency)
      
      # Salvar padrão de recorrência no agendamento pai
      parent_appointment.update!(
        recurrence_pattern: {
          frequency: frequency.to_s,
          occurrences: occurrences,
          end_date: end_date&.iso8601
        }
      )
      
      created_appointments = []
      interval = RECURRENCE_FREQUENCIES[frequency]
      current_date = parent_appointment.start_time
      count = 0
      
      ApplicationRecord.transaction do
        while count < occurrences && (end_date.nil? || current_date.to_date <= end_date)
          # Pular o primeiro (já é o parent)
          if count > 0
            appointment = create_recurring_appointment(parent_appointment, current_date)
            created_appointments << appointment
          end
          
          current_date += interval
          count += 1
        end
        
        context.created_appointments = created_appointments
        context.count = created_appointments.count
      end
    rescue => e
      context.fail!(error: e.message)
    end

    private

    def create_recurring_appointment(parent_appointment, start_time)
      # Calcular end_time baseado na duração do agendamento original
      duration = parent_appointment.end_time - parent_appointment.start_time
      end_time = start_time + duration
      
      appointment = Appointment.create!(
        account: parent_appointment.account,
        account_user: parent_appointment.account_user,
        service: parent_appointment.service,
        contact: parent_appointment.contact,
        start_time: start_time,
        end_time: end_time,
        price_cents: parent_appointment.price_cents,
        price_currency: parent_appointment.price_currency,
        whatsapp_number: parent_appointment.whatsapp_number,
        status: parent_appointment.status,
        payment_status: parent_appointment.payment_status,
        parent_appointment_id: parent_appointment.id,
        recurrence_pattern: parent_appointment.recurrence_pattern
      )
      
      # Gerar link do Google Meet se o parent tiver
      if parent_appointment.google_meet_link.present?
        Appointments::GenerateGoogleMeetLink.call(appointment: appointment)
      end
      
      appointment
    end
  end
end


