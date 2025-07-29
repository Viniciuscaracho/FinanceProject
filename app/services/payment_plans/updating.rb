# frozen_string_literal: true

module PaymentPlans
  class Updating < ApplicationService
    def call
      result = case context.changed
               when :amount_cents
                 PaymentPlans::OnAmountCentsChanged.call(payment_plan: context.payment_plan)
               when :number_of_installments
                 PaymentPlans::OnNumberOfInstallmentsChanged.call(payment_plan: context.payment_plan)
               when :frequency
                 PaymentPlans::OnFrequencyChanged.call(payment_plan: context.payment_plan)
               when :installment_amount_cents
                 PaymentPlans::OnInstallmentAmountCentsChanged.call(payment_plan: context.payment_plan)
               when :update_other_installments
                 PaymentPlans::OnRefreshOthersCalled.call(payment_plan: context.payment_plan)
               when :remove_installment
                 PaymentPlans::OnRemoveInstallmentCalled.call(payment_plan: context.payment_plan)
               else
                 PaymentPlans::SumInstallments.call(payment_plan: context.payment_plan)
                 PaymentPlans::GenerateNumberOfInstallments.call(payment_plan: context.payment_plan)
               end

      context.total_amount = result.total_amount
      context.number_of_installments = result.number_of_installments
    end
  end
end
