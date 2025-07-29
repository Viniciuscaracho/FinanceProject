# frozen_string_literal: true

module PaymentPlans
  class RefreshInstallmentDueDates < ApplicationService
    def call
      transactions = context.payment_plan.transactions.reject(&:_destroy).sort_by(&:installment_number)
      transaction = transactions.min_by(&:installment_number)
      transactions.each_with_index { |installment, number| update_installment_due_date(transaction:, installment:, number:) }
    end

    private

    def update_installment_due_date(transaction:, installment:, number:)
      installment.installment_type = context.payment_plan.frequency
      installment.due_date = CalculationsHelper.calculate_due_date(due_date: transaction.due_date, frequency: context.payment_plan.frequency, number:)
    end
  end
end
