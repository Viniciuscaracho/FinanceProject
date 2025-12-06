# frozen_string_literal: true

module BarberManagement
  module Stripe
    # Handler de webhooks do Stripe específico para o BarberManagement
    # Filtra eventos que pertencem ao BarberManagement através de metadata
    class WebhookHandler < ApplicationService
      def call
        validate_event!
        process_event
      end

      private

      def validate_event!
        context.fail!(error: 'Event é obrigatório') unless context.event.present?
      end

      def belongs_to_barber_management?
        event = context.event
        event_data = event.data.object

        # Verificar metadata em diferentes lugares dependendo do tipo de evento
        metadata = event_data.metadata || {}
        subscription_metadata = event_data.subscription&.metadata || {}
        customer_metadata = event_data.customer&.metadata || {}
        
        # Para checkout.session.completed, também verificar client_reference_id
        # que contém o account_id e indica que é do BarberManagement
        if event.type == 'checkout.session.completed'
          return true if event_data.client_reference_id.present?
        end

        # Verificar se tem a marca do BarberManagement
        metadata['source'] == 'barber_management' ||
          metadata['project'] == 'BarberManagement' ||
          subscription_metadata['source'] == 'barber_management' ||
          customer_metadata['source'] == 'barber_management'
      end

      def process_event
        event = context.event
        event_type = event.type

        case event_type
        when 'checkout.session.completed'
          # Para checkout, verificar metadata
          if belongs_to_barber_management?
            handle_checkout_completed(event.data.object)
          else
            Rails.logger.debug "BarberManagement::Stripe: Checkout não pertence ao BarberManagement, ignorando"
            context.fail!(error: 'Evento não pertence ao BarberManagement')
          end
        when 'customer.subscription.created', 'customer.subscription.updated'
          # Para subscriptions, processar sempre (identificadas por customer_id)
          handle_subscription_updated(event.data.object)
        when 'customer.subscription.deleted'
          # Para subscriptions, processar sempre (identificadas por customer_id)
          handle_subscription_deleted(event.data.object)
        when 'invoice.payment_succeeded'
          # Para invoices, processar sempre (identificadas por customer_id)
          handle_invoice_payment_succeeded(event.data.object)
        when 'invoice.payment_failed'
          # Para invoices, processar sempre (identificadas por customer_id)
          handle_invoice_payment_failed(event.data.object)
        else
          Rails.logger.info "BarberManagement::Stripe: Evento não processado: #{event_type}"
          context.fail!(error: "Evento não processado: #{event_type}")
        end
      end

      def handle_checkout_completed(session)
        account_id = session.client_reference_id
        return unless account_id

        account = Account.find_by(id: account_id)
        return unless account

        Rails.logger.info "BarberManagement::Stripe: Checkout completado para account #{account_id}"
        
        # Quando o checkout é completado, o Stripe cria uma subscription
        # Precisamos sincronizar essa subscription para atualizar o status da conta
        if session.subscription.present?
          begin
            BarberManagement::Stripe::Client.with_api_key do
              stripe_subscription = ::Stripe::Subscription.retrieve(session.subscription)
              Rails.logger.info "BarberManagement::Stripe: Sincronizando subscription #{stripe_subscription.id} após checkout"
              
              result = Subscriptions::Upsert.call(account: account, stripe_subscription: stripe_subscription)
              
              if result.success?
                Rails.logger.info "BarberManagement::Stripe: Subscription sincronizada com sucesso para account #{account_id}"
              else
                Rails.logger.error "BarberManagement::Stripe: Erro ao sincronizar subscription: #{result.error || result.message}"
              end
            end
          rescue StandardError => e
            Rails.logger.error "BarberManagement::Stripe: Erro ao processar subscription após checkout: #{e.message}"
            Rails.logger.error e.backtrace.join("\n")
            # Não falhar o webhook, apenas logar o erro
          end
        else
          Rails.logger.warn "BarberManagement::Stripe: Checkout completado mas sem subscription_id. Mode: #{session.mode}"
        end
      end

      def handle_subscription_updated(stripe_subscription)
        customer_id = stripe_subscription.customer
        account = Account.find_by(processor_customer_id: customer_id)
        return unless account

        # Usar o serviço existente de upsert de subscription
        Subscriptions::Upsert.call(account: account, stripe_subscription: stripe_subscription)
      end

      def handle_subscription_deleted(stripe_subscription)
        customer_id = stripe_subscription.customer
        account = Account.find_by(processor_customer_id: customer_id)
        return unless account

        subscription = account.subscriptions.find_by(processor_id: stripe_subscription.id)
        return unless subscription

        subscription.update(status: 'canceled')
        Rails.logger.info "BarberManagement::Stripe: Assinatura cancelada para account #{account.id}"
      end

      def handle_invoice_payment_succeeded(invoice)
        customer_id = invoice.customer
        account = Account.find_by(processor_customer_id: customer_id)
        return unless account

        Rails.logger.info "BarberManagement::Stripe: Pagamento de invoice bem-sucedido para account #{account.id}"
        
        # Sincronizar a subscription primeiro para atualizar o status
        if invoice.subscription.present?
          stripe_subscription = ::Stripe::Subscription.retrieve(invoice.subscription)
          result = Subscriptions::Upsert.call(account: account, stripe_subscription: stripe_subscription)
          
          # Sincronizar invoice após subscription ser atualizada
          if result.success? && defined?(SubscriptionInvoices::Upsert)
            # Usar a subscription do resultado ou buscar novamente
            subscription = result.subscription || account.subscriptions.find_by(processor_id: invoice.subscription)
            if subscription
              SubscriptionInvoices::Upsert.call(account: account, subscription: subscription, stripe_invoice: invoice)
            end
          end
        end
      end

      def handle_invoice_payment_failed(invoice)
        customer_id = invoice.customer
        account = Account.find_by(processor_customer_id: customer_id)
        return unless account

        Rails.logger.warn "BarberManagement::Stripe: Falha no pagamento de invoice para account #{account.id}"
        # Aqui você pode adicionar lógica para notificar o usuário
      end
    end
  end
end

