# frozen_string_literal: true

module Subscriptions
  class CreateCheckoutPortalSession < ApplicationService
    def call
      params = checkout_session_params
      # If the account has a referral code, use it
      params = if use_coupon?
                 params.merge(discounts: [{ coupon: context.account.referral_code.code }])
               else
                 params.merge(allow_promotion_codes: true)
               end
      context.session = Stripe::Checkout::Session.create(params)
    end

    private

    def use_coupon?
      context.account.referral_code.present? &&
        context.account.referral_code.discount? &&
        context.account.referral_code.benefit.positive?
    end

    def checkout_session_params
      plan_id = context.processor_plan_id || context.account.processor_plan_id
      frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
      {
        success_url: ENV.fetch('CHECKOUT_PORTAL_SUCCESS_URL', "#{frontend_url}/subscription?session_id={CHECKOUT_SESSION_ID}&success=true"),
        cancel_url: ENV.fetch('CHECKOUT_PORTAL_CANCEL_URL', "#{frontend_url}/subscription?canceled=true"),
        mode: 'subscription',
        currency: context.account.default_currency.downcase,
        customer: context.account.processor_customer_id,
        client_reference_id: context.account.id,
        payment_method_types: %w[card boleto],
        locale: context.user&.preferred_language || 'pt-BR',
        line_items: [{ quantity: 1, price: plan_id }]
      }
    end
  end
end
