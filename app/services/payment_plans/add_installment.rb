# frozen_string_literal: true

module PaymentPlans
  class AddInstallment < ApplicationService
    def call
      installment_attributes = context.transaction.dup.tap do |installment|
        PaymentPlans::PopulateInstallment.call(
          payment_plan: context.payment_plan,
          transaction: context.transaction,
          installment:,
          number: context.transaction.installment_number + context.increment
        )
      end.attributes

      context.payment_plan.transactions.build(installment_attributes)
    end
  end
end
