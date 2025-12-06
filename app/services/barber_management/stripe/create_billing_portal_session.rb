# frozen_string_literal: true

module BarberManagement
  module Stripe
    # Cria uma sessão do portal de billing do Stripe específica para o BarberManagement
    class CreateBillingPortalSession < ApplicationService
      def call
        validate_configuration!
        validate_params!

        BarberManagement::Stripe::Client.with_api_key do
          context.session = ::Stripe::BillingPortal::Session.create(build_portal_params)
        end
      end

      private

      def validate_configuration!
        unless BarberManagement::Stripe::Client.configured?
          context.fail!(error: 'Stripe não está configurado para o BarberManagement')
        end
      end

      def validate_params!
        context.fail!(error: 'Account é obrigatório') unless context.account.present?
        unless context.account.processor_customer_id.present?
          context.fail!(error: 'Cliente não encontrado no Stripe')
        end
      end

      def build_portal_params
        account = context.account
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')

        {
          customer: account.processor_customer_id,
          return_url: context.return_url || ENV.fetch(
            'BARBER_MANAGEMENT_BILLING_PORTAL_RETURN_URL',
            "#{frontend_url}/subscription"
          )
        }
      end
    end
  end
end

