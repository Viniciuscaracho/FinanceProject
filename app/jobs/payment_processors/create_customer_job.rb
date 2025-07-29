# frozen_string_literal: true

module PaymentProcessors
  class CreateCustomerJob < ApplicationJob
    queue_as :default

    def perform(account_id, params)
      account = Account.find_by(id: account_id)
      return if account.blank?
      return if account.processor_customer_id.present?

      customer = Stripe::Customer.create(params)
      account.update_column(:processor_customer_id, customer.id)
    end
  end
end
