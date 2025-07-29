# frozen_string_literal: true

module PaymentPlans
  class RefreshInstallmentNumbers < ApplicationService
    def call
      update_number_of_installments
    end

    private

    def update_number_of_installments
      transactions = context.payment_plan.transactions.reject(&:_destroy).sort_by(&:installment_number)
      if context.payment_plan.number_of_installments > transactions.size
        difference = context.payment_plan.number_of_installments - transactions.size
        PaymentPlans::AddInstallments.call(payment_plan: context.payment_plan, quantity: difference)
      elsif context.payment_plan.number_of_installments < transactions.size
        difference = transactions.size - context.payment_plan.number_of_installments
        PaymentPlans::RemoveInstallments.call(payment_plan: context.payment_plan, quantity: difference)
      end

      update_installment_numbers
    end

    def update_installment_numbers
      transactions = context.payment_plan.transactions.reject(&:_destroy).sort_by(&:installment_number)
      transactions.each_with_index { |installment, number| update_installment_amount(installment:, number:) }
    end

    def update_installment_amount(installment:, number:)
      installment.installment_number = number + 1
      installment.installment_total = context.payment_plan.number_of_installments
    end
  end
end
