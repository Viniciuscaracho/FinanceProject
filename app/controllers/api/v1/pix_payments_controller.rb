# frozen_string_literal: true

module Api
  module V1
    class PixPaymentsController < ApplicationController
      before_action :set_account

      def create_billing
        amount = params[:amount].to_i
        plan_id = params[:plan_id]
        plan_name = params[:plan_name]
        plan_description = params[:plan_description]
        frequency = params[:frequency].presence || 'MONTHLY'

        return render json: { error: 'amount é obrigatório' }, status: :bad_request unless amount > 0
        return render json: { error: 'plan_name é obrigatório' }, status: :bad_request unless plan_name.present?

        result = BarberManagement::AbacatePay::CreateBilling.call(
          account: @account,
          amount: amount,
          plan_id: plan_id,
          plan_name: plan_name,
          plan_description: plan_description,
          frequency: frequency
        )

        if result.success?
          render json: {
            billing_url: result.billing_url,
            billing_id: result.pix_billing.billing_id,
            status: result.pix_billing.status
          }
        else
          render json: { error: result.error || 'Erro ao criar cobrança PIX' }, status: :unprocessable_entity
        end
      rescue StandardError => e
        Rails.logger.error "PixPayments#create_billing: #{e.message}"
        render json: { error: 'Erro ao criar cobrança PIX', message: e.message }, status: :internal_server_error
      end

      def status
        billing_id = params[:billing_id]
        pix_billing = @account.pix_billings.find_by(billing_id: billing_id)

        return render json: { error: 'Cobrança não encontrada' }, status: :not_found unless pix_billing

        render json: {
          billing_id: pix_billing.billing_id,
          status: pix_billing.status,
          paid_at: pix_billing.paid_at,
          amount: pix_billing.amount,
          plan_name: pix_billing.plan_name
        }
      end

      def index
        billings = @account.pix_billings.order(created_at: :desc).limit(10)
        render json: { pix_billings: billings.map { |b| billing_json(b) } }
      end

      # Sincroniza billings pendentes com o AbacatePay e retorna a assinatura atualizada.
      # Chamado pelo frontend quando o usuário retorna da página de pagamento.
      def sync
        billing_id = params[:billing_id]

        result = BarberManagement::AbacatePay::SyncBillings.call(
          account: @account,
          billing_id: billing_id
        )

        unless result.success?
          return render json: { error: result.error || 'Erro ao sincronizar' }, status: :unprocessable_entity
        end

        subscription = @account.reload.last_active_subscription || @account.subscription || @account.last_subscription
        latest_pix   = @account.pix_billings.order(created_at: :desc).first

        render json: {
          synced_count: result.synced_count || 0,
          subscription: subscription_json(subscription),
          subscribed:   subscription&.access_granted? || false,
          pix_status:   latest_pix&.status
        }
      rescue StandardError => e
        Rails.logger.error "PixPayments#sync: #{e.message}"
        render json: { error: 'Erro ao sincronizar pagamento PIX' }, status: :internal_server_error
      end

      private

      def set_account
        @account = Current.account
        render json: { error: 'Account not found' }, status: :forbidden unless @account
      end

      def subscription_json(sub)
        return nil unless sub
        {
          id: sub.id,
          processor_id: sub.processor_id,
          status: sub.status,
          name: sub.name,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end
        }
      end

      def billing_json(billing)
        {
          id: billing.id,
          billing_id: billing.billing_id,
          billing_url: billing.billing_url,
          amount: billing.amount,
          status: billing.status,
          plan_name: billing.plan_name,
          paid_at: billing.paid_at,
          created_at: billing.created_at
        }
      end
    end
  end
end
