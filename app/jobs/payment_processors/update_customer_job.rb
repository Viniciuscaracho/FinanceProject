# frozen_string_literal: true

module PaymentProcessors
  class UpdateCustomerJob < ApplicationJob
    queue_as :default

    def perform(account_id, params)
      account = Account.find_by(id: account_id)
      return if account.blank?
      return if account.processor_customer_id.blank?

      Stripe::Customer.update(account.processor_customer_id, params)
    end
  end
end
