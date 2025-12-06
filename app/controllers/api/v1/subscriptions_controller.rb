# frozen_string_literal: true

module Api
  module V1
    class SubscriptionsController < ApplicationController
      before_action :set_account

      # GET /api/v1/subscriptions
      # Retorna informações sobre a assinatura atual
      def index
        # Buscar a subscription associada ou a última subscription ativa
        subscription = @account.subscription || @account.last_active_subscription || @account.last_subscription
        
        # Log para debug
        Rails.logger.info "SubscriptionsController#index - Account #{@account.id}:"
        Rails.logger.info "  subscription_id: #{@account.subscription_id}"
        Rails.logger.info "  subscription (belongs_to): #{@account.subscription&.id}"
        Rails.logger.info "  last_active_subscription: #{@account.last_active_subscription&.id}"
        Rails.logger.info "  last_subscription: #{@account.last_subscription&.id}"
        Rails.logger.info "  all subscriptions count: #{@account.subscriptions.count}"
        Rails.logger.info "  selected subscription: #{subscription&.id}"
        
        render json: subscription_json(subscription)
      end

      # GET /api/v1/subscriptions/plans
      # Lista os planos disponíveis do BarberManagement
      def plans
        # Buscar produtos e preços do Stripe usando a integração dedicada
        BarberManagement::Stripe::Client.with_api_key do
          products = ::Stripe::Product.list(active: true, limit: 100)
          prices = ::Stripe::Price.list(active: true, limit: 100)

          # Filtrar apenas produtos do BarberManagement
          barber_management_products = products.data.select do |product|
            product.metadata['source'] == 'barber_management' ||
            product.metadata['project'] == 'BarberManagement' ||
            product.name.include?('BarberManagement')
          end

          if barber_management_products.empty?
            Rails.logger.warn "Nenhum produto do BarberManagement encontrado no Stripe"
            # Se não encontrar produtos marcados, retornar todos (para compatibilidade)
            barber_management_products = products.data
          end

          plans = barber_management_products.map do |product|
            product_prices = prices.data.select { |p| p.product == product.id }
            product_prices.map do |price|
              {
                id: price.id,
                product_id: product.id,
                name: product.name,
                description: product.description || '',
                amount: price.unit_amount,
                currency: price.currency,
                interval: price.recurring&.interval, # month, year, etc
                interval_count: price.recurring&.interval_count || 1,
                metadata: price.metadata.to_hash
              }
            end
          end.flatten

          Rails.logger.info "BarberManagement: Retornando #{plans.count} planos"
          Rails.logger.debug "Planos detalhados: #{plans.inspect}"
          render json: { plans: plans }
        end
      rescue StandardError => e
        Rails.logger.error "Error fetching plans: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Erro ao buscar planos', message: e.message }, status: :internal_server_error
      end

      # POST /api/v1/subscriptions/create_checkout
      # Cria uma sessão de checkout do Stripe
      def create_checkout
        plan_id = params[:plan_id]
        
        unless plan_id.present?
          render json: { error: 'plan_id é obrigatório' }, status: :bad_request
          return
        end

        # Verificar se o plano existe usando a integração dedicada
        begin
          BarberManagement::Stripe::Client.with_api_key do
            ::Stripe::Price.retrieve(plan_id)
          end
        rescue ::Stripe::InvalidRequestError => e
          render json: { error: 'Plano inválido', message: e.message }, status: :bad_request
          return
        end

        # Criar sessão de checkout usando a integração dedicada do BarberManagement
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
          # Interactor coloca o erro em context.error
          error_message = result.error || result.message || 'Erro ao criar sessão de checkout'
          Rails.logger.error "BarberManagement::Stripe checkout failed: #{error_message}"
          Rails.logger.error "Context: #{result.context.inspect}" if result.context
          render json: { 
            error: 'Erro ao criar sessão de checkout', 
            message: error_message
          }, status: :internal_server_error
        end
      rescue StandardError => e
        Rails.logger.error "Error creating checkout: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { 
          error: 'Erro ao criar checkout', 
          message: e.message,
          class: e.class.name
        }, status: :internal_server_error
      end

      # GET /api/v1/subscriptions/billing_portal
      # Cria uma sessão do portal de billing do Stripe
      def billing_portal
        unless @account.processor_customer_id.present?
          render json: { error: 'Cliente não encontrado no Stripe' }, status: :not_found
          return
        end

        begin
          # Usar a integração dedicada do BarberManagement
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
      end

      # POST /api/v1/subscriptions/cancel
      # Cancela a assinatura atual
      def cancel
        subscription = @account.subscription
        unless subscription
          render json: { error: 'Nenhuma assinatura encontrada' }, status: :not_found
          return
        end

        begin
          # Verificar se é uma subscription de teste (processor_id começa com "sub_test_")
          if subscription.processor_id.start_with?('sub_test_')
            # Para subscriptions de teste, apenas atualizar no banco local
            Rails.logger.info "Cancelando subscription de teste: #{subscription.processor_id}"
            subscription.update!(
              status: 'canceled',
              cancel_at_period_end: true
            )
            render json: subscription_json(subscription)
            return
          end

          # Para subscriptions reais, cancelar no Stripe
          BarberManagement::Stripe::Client.with_api_key do
            stripe_subscription = ::Stripe::Subscription.retrieve(subscription.processor_id)
            updated_subscription = ::Stripe::Subscription.update(
              subscription.processor_id,
              { cancel_at_period_end: true }
            )

            subscription.sync!(updated_subscription)
            render json: subscription_json(subscription)
          end
        rescue ::Stripe::InvalidRequestError => e
          if e.message.include?('No such subscription')
            Rails.logger.warn "Subscription não encontrada no Stripe: #{subscription.processor_id}. Cancelando apenas no banco local."
            # Se a subscription não existe no Stripe, cancelar apenas no banco local
            subscription.update!(
              status: 'canceled',
              cancel_at_period_end: true
            )
            render json: subscription_json(subscription)
          else
            Rails.logger.error "Error canceling subscription: #{e.message}"
            render json: { error: 'Erro ao cancelar assinatura', message: e.message }, status: :internal_server_error
          end
        rescue StandardError => e
          Rails.logger.error "Error canceling subscription: #{e.message}"
          render json: { error: 'Erro ao cancelar assinatura', message: e.message }, status: :internal_server_error
        end
      end

      # POST /api/v1/subscriptions/reactivate
      # Reativa uma assinatura cancelada
      def reactivate
        subscription = @account.subscription
        unless subscription
          render json: { error: 'Nenhuma assinatura encontrada' }, status: :not_found
          return
        end

        begin
          # Verificar se é uma subscription de teste
          if subscription.processor_id.start_with?('sub_test_')
            # Para subscriptions de teste, apenas atualizar no banco local
            Rails.logger.info "Reativando subscription de teste: #{subscription.processor_id}"
            subscription.update!(
              status: 'active',
              cancel_at_period_end: false
            )
            render json: subscription_json(subscription)
            return
          end

          # Para subscriptions reais, reativar no Stripe
          BarberManagement::Stripe::Client.with_api_key do
            stripe_subscription = ::Stripe::Subscription.retrieve(subscription.processor_id)
            updated_subscription = ::Stripe::Subscription.update(
              subscription.processor_id,
              { cancel_at_period_end: false }
            )

            subscription.sync!(updated_subscription)
            render json: subscription_json(subscription)
          end
        rescue ::Stripe::InvalidRequestError => e
          if e.message.include?('No such subscription')
            Rails.logger.warn "Subscription não encontrada no Stripe: #{subscription.processor_id}. Reativando apenas no banco local."
            # Se a subscription não existe no Stripe, reativar apenas no banco local
            subscription.update!(
              status: 'active',
              cancel_at_period_end: false
            )
            render json: subscription_json(subscription)
          else
            Rails.logger.error "Error reactivating subscription: #{e.message}"
            render json: { error: 'Erro ao reativar assinatura', message: e.message }, status: :internal_server_error
          end
        rescue StandardError => e
          Rails.logger.error "Error reactivating subscription: #{e.message}"
          render json: { error: 'Erro ao reativar assinatura', message: e.message }, status: :internal_server_error
        end
      end

      private

      def set_account
        @account = Current.account
        unless @account
          render json: { error: 'Account not found' }, status: :forbidden
          return
        end
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

