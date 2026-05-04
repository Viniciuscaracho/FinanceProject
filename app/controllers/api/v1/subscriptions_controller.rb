# frozen_string_literal: true

module Api
  module V1
    class SubscriptionsController < ApplicationController
      before_action :set_account

      def index
        subscription = @account.subscription || @account.last_active_subscription || @account.last_subscription
        render json: subscription_json(subscription)
      end

      def plans
        BarberManagement::Stripe::Client.with_api_key do
          products = ::Stripe::Product.list(active: true, limit: 100)
          prices = ::Stripe::Price.list(active: true, limit: 100)

          barber_management_products = products.data.select do |product|
            product.metadata['source'] == 'barber_management' ||
            product.metadata['project'] == 'BarberManagement' ||
            product.name.include?('BarberManagement')
          end

          barber_management_products = products.data if barber_management_products.empty?

          render json: {
            plans: barber_management_products.flat_map do |product|
              prices.data.select { |p| p.product == product.id }.map do |price|
                {
                  id: price.id,
                  product_id: product.id,
                  name: product.name,
                  description: product.description || '',
                  amount: price.unit_amount,
                  currency: price.currency,
                  interval: price.recurring&.interval,
                  interval_count: price.recurring&.interval_count || 1,
                  metadata: price.metadata.to_hash
                }
              end
            end
          }
        end
      rescue StandardError => e
        Rails.logger.error "Error fetching plans: #{e.message}"
        render json: { error: 'Erro ao buscar planos', message: e.message }, status: :internal_server_error
      end

      def create_checkout
        plan_id = params[:plan_id]
        return render json: { error: 'plan_id é obrigatório' }, status: :bad_request unless plan_id.present?

        begin
          BarberManagement::Stripe::Client.with_api_key do
            ::Stripe::Price.retrieve(plan_id)
          end
        rescue ::Stripe::InvalidRequestError => e
          return render json: { error: 'Plano inválido', message: e.message }, status: :bad_request
        end

        result = BarberManagement::Stripe::CreateCheckoutSession.call(
          account: @account,
          user: Current.user,
          plan_id: plan_id
        )

        if result.success?
          render json: {
            checkout_url: result.session.url,
            session_id: result.session.id
          }
        else
          error_message = result.error || result.message || 'Erro ao criar sessão de checkout'
          Rails.logger.error "BarberManagement::Stripe checkout failed: #{error_message}"
          render json: {
            error: 'Erro ao criar sessão de checkout',
            message: error_message
          }, status: :internal_server_error
        end
      rescue StandardError => e
        Rails.logger.error "Error creating checkout: #{e.message}"
        render json: {
          error: 'Erro ao criar checkout',
          message: e.message,
          class: e.class.name
        }, status: :internal_server_error
      end

      def billing_portal
        return render json: { error: 'Cliente não encontrado no Stripe' }, status: :not_found unless @account.processor_customer_id.present?

        result = BarberManagement::Stripe::CreateBillingPortalSession.call(
          account: @account,
          return_url: params[:return_url]
        )

        if result.success?
          render json: {
            portal_url: result.session.url,
            session_id: result.session.id
          }
        else
          render json: { error: result.error || 'Erro ao criar portal de billing' }, status: :internal_server_error
        end
      rescue StandardError => e
        Rails.logger.error "Error creating billing portal: #{e.message}"
        render json: { error: 'Erro ao criar portal de billing', message: e.message }, status: :internal_server_error
      end

      def cancel
        subscription = @account.subscription
        return render json: { error: 'Nenhuma assinatura encontrada' }, status: :not_found unless subscription

        if subscription.processor_id.start_with?('sub_test_')
          subscription.update!(status: 'canceled', cancel_at_period_end: true)
          return render json: subscription_json(subscription)
        end

        BarberManagement::Stripe::Client.with_api_key do
          subscription.sync!(::Stripe::Subscription.update(subscription.processor_id, { cancel_at_period_end: true }))
          render json: subscription_json(subscription)
        end
      rescue ::Stripe::InvalidRequestError => e
        if e.message.include?('No such subscription')
          subscription.update!(status: 'canceled', cancel_at_period_end: true)
          render json: subscription_json(subscription)
        else
          Rails.logger.error "Error canceling subscription: #{e.message}"
          render json: { error: 'Erro ao cancelar assinatura', message: e.message }, status: :internal_server_error
        end
      rescue StandardError => e
        Rails.logger.error "Error canceling subscription: #{e.message}"
        render json: { error: 'Erro ao cancelar assinatura', message: e.message }, status: :internal_server_error
      end

      def reactivate
        subscription = @account.subscription
        return render json: { error: 'Nenhuma assinatura encontrada' }, status: :not_found unless subscription

        if subscription.processor_id.start_with?('sub_test_')
          subscription.update!(status: 'active', cancel_at_period_end: false)
          return render json: subscription_json(subscription)
        end

        BarberManagement::Stripe::Client.with_api_key do
          subscription.sync!(::Stripe::Subscription.update(subscription.processor_id, { cancel_at_period_end: false }))
          render json: subscription_json(subscription)
        end
      rescue ::Stripe::InvalidRequestError => e
        if e.message.include?('No such subscription')
          subscription.update!(status: 'active', cancel_at_period_end: false)
          render json: subscription_json(subscription)
        else
          Rails.logger.error "Error reactivating subscription: #{e.message}"
          render json: { error: 'Erro ao reativar assinatura', message: e.message }, status: :internal_server_error
        end
      rescue StandardError => e
        Rails.logger.error "Error reactivating subscription: #{e.message}"
        render json: { error: 'Erro ao reativar assinatura', message: e.message }, status: :internal_server_error
      end

      private

      def set_account
        @account = Current.account
        return render json: { error: 'Account not found' }, status: :forbidden unless @account
      end

      def subscription_json(subscription)
        return { subscription: nil, subscribed: false } unless subscription

        {
          subscription: {
            id: subscription.id,
            processor_id: subscription.processor_id,
            status: subscription.status,
            name: subscription.name,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            plan: {
              id: subscription.plan_id,
              nickname: subscription.plan_nickname,
              product: subscription.plan_product
            }
          },
          subscribed: subscription.access_granted?,
          account: {
            subscription_status: @account.subscription_status,
            processor_plan_id: @account.processor_plan_id,
            processor_plan_name: @account.processor_plan_name
          }
        }
      end
    end
  end
end
