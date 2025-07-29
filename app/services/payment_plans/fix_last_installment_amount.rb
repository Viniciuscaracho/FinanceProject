# frozen_string_literal: true

module PaymentPlans
  class FixLastInstallmentAmount < ApplicationService
    def call
      total_amount     = context.payment_plan.amount_cents
      transactions     = context.payment_plan.transactions.reject(&:_destroy).sort_by(&:installment_number)
      transactions_sum = transactions.sum(&:amount_cents)
      difference       = total_amount - transactions_sum

      return if difference.zero?

      last_installment = transactions.reject(&:paid?).max_by(&:installment_number)

      return if last_installment.nil?

      last_installment.amount_cents += difference

    end
  end
end
