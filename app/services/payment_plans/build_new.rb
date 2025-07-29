# frozen_string_literal: true

module PaymentPlans
  class BuildNew < ApplicationService
    def call
      build_new_payment_plan
    end

    private

    def build_new_payment_plan
      context.payment_plan = context.account.payment_plans.new(
        type: :installment,
        amount_cents: context.transaction.amount_cents,
        amount_type: :total_amount,
        number_of_installments: 3,
        frequency: :monthly
      )
    end
  end
end
