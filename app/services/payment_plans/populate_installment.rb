# frozen_string_literal: true

module PaymentPlans
  class PopulateInstallment < ApplicationService
    def call
      populate_installment(installment: context.installment, number: context.number)
    end

    private

    def populate_installment(installment:, number:)
      installment.payment_type = :installment
      installment.installment_number = number + 1
      installment.installment_total = context.payment_plan.number_of_installments
      installment.installment_type = context.payment_plan.frequency
      installment.due_date = CalculationsHelper.calculate_due_date(due_date: context.transaction.due_date, frequency: context.payment_plan.frequency, number:)
      installment.amount_cents = context.payment_plan.persisted? ? 0 : CalculationsHelper.calculate_amount_cents(amount_cents: context.payment_plan.amount_cents, number_of_installments: context.payment_plan.number_of_installments)
      installment.competency_date = number.zero? ? context.transaction.competency_date : nil
      installment.document_number = number.zero? ? context.transaction.document_number : nil
      installment.paid = number.zero? ? context.transaction.paid : false
      installment.paid_at = number.zero? ? context.transaction.paid_at : nil
      installment.tag_list = context.transaction.tag_list
    end
  end
end
