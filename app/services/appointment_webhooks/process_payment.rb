# frozen_string_literal: true

module AppointmentWebhooks
  class ProcessPayment < ApplicationService
    def call
      event = context.event
      event_type = event.type

      case event_type
      when 'checkout.session.completed'
        process_checkout_completed(event.data.object)
      when 'payment_intent.succeeded'
        process_payment_succeeded(event.data.object)
      when 'payment_intent.payment_failed'
        process_payment_failed(event.data.object)
      else
        Rails.logger.info "Evento não processado: #{event_type}"
      end
    end

    private

    def process_checkout_completed(session)
      appointment_id = session.metadata&.dig('appointment_id')
      return unless appointment_id

      appointment = Appointment.find_by(id: appointment_id)
      return unless appointment

      # Atualizar com payment_intent_id se disponível
      if session.payment_intent
        appointment.update(stripe_payment_intent_id: session.payment_intent)
      end

      # Confirmar agendamento
      appointment.confirm_payment!

      # Enviar notificações (pode ser implementado depois)
      send_notifications(appointment)

      Rails.logger.info "Agendamento #{appointment_id} confirmado após pagamento"
    end

    def process_payment_succeeded(payment_intent)
      appointment = Appointment.find_by(stripe_payment_intent_id: payment_intent.id)
      return unless appointment

      # Confirmar agendamento se ainda não estiver confirmado
      if appointment.payment_status != Appointment::PAYMENT_STATUS[:paid]
        appointment.confirm_payment!
        send_notifications(appointment)
        Rails.logger.info "Agendamento #{appointment.id} confirmado após payment_intent.succeeded"
      end
    end

    def process_payment_failed(payment_intent)
      appointment = Appointment.find_by(stripe_payment_intent_id: payment_intent.id)
      return unless appointment

      appointment.update(payment_status: Appointment::PAYMENT_STATUS[:failed])
      Rails.logger.warn "Pagamento falhou para agendamento #{appointment.id}"
    end

    def send_notifications(appointment)
      # TODO: Implementar envio de notificações via WhatsApp
      # Por enquanto, apenas log
      Rails.logger.info "Notificações enviadas para agendamento #{appointment.id}"
      Rails.logger.info "Cliente: #{appointment.whatsapp_number}"
      Rails.logger.info "Profissional: #{appointment.account_user.user.email}"
    end
  end
end

