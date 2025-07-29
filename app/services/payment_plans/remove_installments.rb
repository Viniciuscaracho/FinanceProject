# frozen_string_literal: true

module PaymentPlans
  class RemoveInstallments < ApplicationService
    def call
      last_installment = context.payment_plan.transactions.reject(&:_destroy).max_by(&:installment_number)
      last_installment.mark_for_destruction
    end
  end
end
