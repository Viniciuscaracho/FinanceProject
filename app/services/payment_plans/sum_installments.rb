# frozen_string_literal: true

module PaymentPlans
  class SumInstallments < ApplicationService
    def call
      context.total_amount = context.payment_plan.transactions.reject(&:_destroy).sum(&:amount_cents)
    end
  end
end
