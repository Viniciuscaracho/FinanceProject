# frozen_string_literal: true

module PaymentPlans
  class GenerateNumberOfInstallments < ApplicationService
    def call
      context.number_of_installments = {}
      (2..120).each { |number| context.number_of_installments[number] = generate_installment_number(number:) }
    end

    private

    def generate_installment_number(number:)
      context.payment_plan.total_amount? ? context.payment_plan.amount_cents / number : context.payment_plan.amount_cents
    end
  end
end
