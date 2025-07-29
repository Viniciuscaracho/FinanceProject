# frozen_string_literal: true

module PaymentPlans
  class RefreshInstallmentAmounts < ApplicationService
    def call
      update_installment_amounts unless context.payment_plan.persisted?
    end

    private

    def update_installment_amounts
      context.payment_plan.transactions.sort_by(&:installment_number).each do |installment|
        update_installment_amount(installment:)
      end
    end

    def update_installment_amount(installment:)
      installment.amount_cents = CalculationsHelper.calculate_amount_cents(
        amount_cents: context.payment_plan.amount_cents,
        number_of_installments: context.payment_plan.number_of_installments
      )
    end
  end
end
