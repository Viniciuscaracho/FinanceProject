# frozen_string_literal: true

module BarberManagement
  module AbacatePay
    class HandleWebhook < ApplicationService
      def call
        event = context.event
        # v2 payload: { event: 'billing.paid', billing: { id: ..., status: 'PAID', ... } }
        # fallback para outros formatos
        billing_data = event.dig('billing') ||
                       event.dig('data', 'billing') ||
                       event.dig('checkout') ||
                       event

        billing_id = billing_data['id']
        event_type = context.event_type ||
                     (billing_data['status'] == 'PAID' ? 'billing.paid' : nil)

        pix_billing = PixBilling.find_by(billing_id: billing_id)
        unless pix_billing
          Rails.logger.warn "AbacatePay webhook: billing #{billing_id} não encontrado"
          return
        end

        case event_type
        when 'billing.paid', 'BILLING_PAID'
          handle_paid(pix_billing, billing_data)
        when 'billing.expired', 'BILLING_EXPIRED'
          pix_billing.update!(status: 'EXPIRED')
          Rails.logger.info "AbacatePay: billing #{billing_id} expirado"
        when 'billing.cancelled', 'BILLING_CANCELLED'
          pix_billing.update!(status: 'CANCELLED')
        else
          Rails.logger.info "AbacatePay webhook: evento não tratado #{event_type}"
        end
      end

      private

      def handle_paid(pix_billing, billing_data)
        pix_billing.update!(
          status: 'PAID',
          paid_at: Time.current,
          metadata: pix_billing.metadata.merge(billing_data)
        )

        account = pix_billing.account
        activate_subscription(account, pix_billing)

        Rails.logger.info "AbacatePay: billing #{pix_billing.billing_id} pago — account #{account.id} ativado"
      end

      def activate_subscription(account, pix_billing)
        period_start = Time.current
        period_end = period_start + 1.month

        subscription = account.subscriptions.find_or_initialize_by(processor_id: pix_billing.billing_id)
        subscription.assign_attributes(
          processor_plan_id: pix_billing.plan_id,
          name: "#{account.name} - #{pix_billing.plan_name}",
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: period_start,
          current_period_end: period_end,
          data: { collection_method: 'pix', processor: 'abacate_pay', amount: pix_billing.amount },
          metadata: { processor: 'abacate_pay', billing_id: pix_billing.billing_id }
        )
        subscription.save!

        account.assign_subscription_attributes(subscription)
        account.without_auditing { account.save! } if account.changed?
      end
    end
  end
end
