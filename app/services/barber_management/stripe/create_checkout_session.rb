# frozen_string_literal: true

module BarberManagement
  module Stripe
    # Cria uma sessão de checkout do Stripe específica para o BarberManagement
    class CreateCheckoutSession < ApplicationService
      def call
        validate_configuration!
        validate_params!

        begin
          BarberManagement::Stripe::Client.with_api_key do
            params = build_checkout_params
            Rails.logger.info "BarberManagement::Stripe: Criando checkout session para account #{context.account.id}, plan #{context.plan_id}"
            context.session = ::Stripe::Checkout::Session.create(params)
            Rails.logger.info "BarberManagement::Stripe: Checkout session criada com sucesso: #{context.session.id}"
          end
        rescue ::Stripe::StripeError => e
          Rails.logger.error "BarberManagement::Stripe: Erro do Stripe: #{e.message}"
          context.fail!(error: "Erro ao criar checkout no Stripe: #{e.message}")
        rescue StandardError => e
          Rails.logger.error "BarberManagement::Stripe: Erro inesperado: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          context.fail!(error: "Erro inesperado: #{e.message}")
        end
      end

      private

      def validate_configuration!
        unless BarberManagement::Stripe::Client.configured?
          Rails.logger.error "BarberManagement::Stripe não configurado. Verifique as credenciais."
          context.fail!(error: 'Stripe não está configurado para o BarberManagement. Configure as credenciais em rails credentials:edit')
        end
      end

      def validate_params!
        unless context.account.present?
          Rails.logger.error "Account não fornecido no contexto"
          context.fail!(error: 'Account é obrigatório')
        end
        unless context.plan_id.present?
          Rails.logger.error "Plan ID não fornecido no contexto"
          context.fail!(error: 'Plan ID é obrigatório')
        end
      end

      def build_checkout_params
        account = context.account
        user = context.user || account.owner
        plan_id = context.plan_id

        # Garantir que o customer existe no Stripe
        customer_id = ensure_customer_exists(account, user)

        {
          mode: 'subscription',
          customer: customer_id,
          line_items: [{ price: plan_id, quantity: 1 }],
          payment_method_types: %w[card boleto],
          currency: account.default_currency.downcase,
          locale: user&.preferred_language || 'pt-BR',
          success_url: success_url,
          cancel_url: cancel_url,
          client_reference_id: account.id.to_s,
          metadata: BarberManagement::Stripe::Client.default_metadata(
            account_id: account.id,
            user_id: user&.id,
            additional: {
              checkout_type: 'subscription',
              plan_id: plan_id
            }
          ),
          allow_promotion_codes: true,
          subscription_data: {
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: account.id,
              user_id: user&.id,
              additional: {
                subscription_type: 'barber_management'
              }
            )
          }
        }
      end

      def ensure_customer_exists(account, user)
        # Se já tem customer_id, verificar se existe no Stripe
        if account.processor_customer_id.present?
          begin
            customer = ::Stripe::Customer.retrieve(account.processor_customer_id)
            # Verificar se o customer pertence ao BarberManagement
            if customer.metadata['source'] == 'barber_management' || 
               customer.metadata['project'] == 'BarberManagement' ||
               customer.deleted.nil? # Customer existe e não foi deletado
              Rails.logger.info "BarberManagement::Stripe: Usando customer existente: #{customer.id}"
              return customer.id
            else
              Rails.logger.warn "BarberManagement::Stripe: Customer existe mas não pertence ao BarberManagement, criando novo"
            end
          rescue ::Stripe::InvalidRequestError => e
            if e.message.include?('No such customer')
              Rails.logger.warn "BarberManagement::Stripe: Customer #{account.processor_customer_id} não existe no Stripe, criando novo"
              # Limpar o customer_id inválido
              account.update(processor_customer_id: nil)
            else
              raise e
            end
          end
        end

        # Criar novo customer no Stripe
        Rails.logger.info "BarberManagement::Stripe: Criando customer para account #{account.id}"
        customer = ::Stripe::Customer.create(
          email: account.company.email,
          name: account.company.name,
          phone: account.company.phone_number,
          metadata: BarberManagement::Stripe::Client.default_metadata(
            account_id: account.id,
            user_id: user&.id,
            additional: {
              customer_type: 'barber_management'
            }
          )
        )

        account.update(processor_customer_id: customer.id)
        Rails.logger.info "BarberManagement::Stripe: Customer criado: #{customer.id}"
        customer.id
      rescue ::Stripe::StripeError => e
        Rails.logger.error "BarberManagement::Stripe: Erro ao criar/verificar customer: #{e.message}"
        raise e
      end

      def success_url
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
        ENV.fetch(
          'BARBER_MANAGEMENT_CHECKOUT_SUCCESS_URL',
          "#{frontend_url}/subscription?session_id={CHECKOUT_SESSION_ID}&success=true"
        )
      end

      def cancel_url
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
        ENV.fetch(
          'BARBER_MANAGEMENT_CHECKOUT_CANCEL_URL',
          "#{frontend_url}/subscription?canceled=true"
        )
      end
    end
  end
end

