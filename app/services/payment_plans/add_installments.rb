# frozen_string_literal: true

module PaymentPlans
  class AddInstallments < ApplicationService
    def call
      transaction = context.payment_plan.transactions.reject(&:_destroy).sort_by(&:installment_number).max_by(&:installment_number)
      context.quantity.times do |increment|
        PaymentPlans::AddInstallment.call(payment_plan: context.payment_plan, transaction:, increment:)
      end
    end
  end
end
