# frozen_string_literal: true

module Appointments
  class ProcessRefund < ApplicationService
    def call
      appointment = context.appointment
      
      return unless should_process_refund?(appointment)

      refund_result = process_stripe_refund(appointment)
      
      if refund_result[:success]
        update_appointment_status(appointment)
        context.refund_id = refund_result[:refund_id]
      else
        context.fail!(message: refund_result[:error])
      end
    rescue StandardError => e
      Rails.logger.error "Erro ao processar reembolso para agendamento #{context.appointment.id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      context.fail!(message: "Erro ao processar reembolso: #{e.message}")
    end

    private

    def should_process_refund?(appointment)
      # Apenas processar reembolso se:
      # 1. O agendamento estava pago
      # 2. Tem um payment_intent_id do Stripe
      # 3. Ainda não foi reembolsado
      appointment.payment_status == Appointment::PAYMENT_STATUS[:paid] &&
        appointment.stripe_payment_intent_id.present? &&
        appointment.payment_status != Appointment::PAYMENT_STATUS[:refunded]
    end

    def process_stripe_refund(appointment)
      unless BarberManagement::Stripe::Client.configured?
        return { success: false, error: "Stripe não está configurado" }
      end

      BarberManagement::Stripe::Client.with_api_key do
        begin
          # Buscar o payment intent
          payment_intent = ::Stripe::PaymentIntent.retrieve(appointment.stripe_payment_intent_id)
          
          # Verificar se já foi reembolsado
          if payment_intent.status == 'refunded' || payment_intent.charges.data.any? { |c| c.refunded }
            Rails.logger.info "Payment intent #{appointment.stripe_payment_intent_id} já foi reembolsado"
            return { success: true, refund_id: 'already_refunded' }
          end

          # Criar reembolso
          charge_id = payment_intent.charges.data.first&.id
          unless charge_id
            return { success: false, error: "Nenhuma cobrança encontrada no payment intent" }
          end

          refund = ::Stripe::Refund.create(
            charge: charge_id,
            amount: appointment.price_cents, # Reembolsar o valor total
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: appointment.account_id,
              additional: {
                appointment_id: appointment.id,
                reason: 'appointment_cancelled'
              }
            )
          )

          Rails.logger.info "Reembolso criado com sucesso: #{refund.id} para agendamento #{appointment.id}"
          { success: true, refund_id: refund.id }
        rescue ::Stripe::StripeError => e
          Rails.logger.error "Erro do Stripe ao processar reembolso: #{e.message}"
          { success: false, error: "Erro do Stripe: #{e.message}" }
        end
      end
    end

    def update_appointment_status(appointment)
      # O status já foi atualizado no método cancel!, apenas garantir payment_status
      if appointment.payment_status != Appointment::PAYMENT_STATUS[:refunded]
        appointment.update_column(:payment_status, Appointment::PAYMENT_STATUS[:refunded])
      end
    end
  end
end

