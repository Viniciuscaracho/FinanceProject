# frozen_string_literal: true

module Accounts
  module Stripe
    extend ActiveSupport::Concern

    included do
      after_create_commit :create_customer_to_processor
      after_update_commit :update_customer_to_processor
    end

    # Create or Update Customer from Processor Payment
    def create_customer_to_processor
      return unless company_previously_changed?

      PaymentProcessors::CreateCustomerJob.perform_later(id, stripe_customer_params)
    end

    def update_customer_to_processor
      return unless company_previously_changed?

      PaymentProcessors::UpdateCustomerJob.perform_later(id, stripe_customer_params)
    end

    protected

    def stripe_customer_params
      {
        email:,
        name:,
        phone: phone_number,
        preferred_locales: [owner.preferred_language, 'en'],
        metadata: {
          account_id: id,
          owner_id:,
          owner_email: owner.email,
          owner_name: owner.name
        }
      }
    end
  end
end
