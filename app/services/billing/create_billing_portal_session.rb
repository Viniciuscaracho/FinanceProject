# frozen_string_literal: true

module Billing
  class CreateBillingPortalSession < ApplicationService
    def call
      context.session = Stripe::BillingPortal::Session.create(
        customer: context.account.processor_customer_id,
        locale: context.user.preferred_language || 'pt-BR',
        return_url: ENV.fetch('BILLING_PORTAL_RETURN_URL', 'http://localhost:3000')
      )
    end
  end
end
