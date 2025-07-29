# frozen_string_literal: true

module PaymentPlans
  class RefreshOthersInstallmentAmounts < ApplicationService
    def call
      transactions            = context.payment_plan.transactions
      sum_edited_amounts      = transactions.select(&:_amount_cents_edited).sum(&:amount_cents)
      sum_paid_amounts        = transactions.select(&:paid?).sum(&:amount_cents)
      size_non_edited_amounts = transactions.reject(&:_amount_cents_edited).reject(&:paid?).size
      amount_cents            = context.payment_plan.amount_cents - (sum_edited_amounts + sum_paid_amounts)

      transactions.reject(&:_amount_cents_edited).reject(&:paid?).each do |t|
        t.amount_cents = build_other_amount_cents(amount_cents:, size: size_non_edited_amounts)
      end

      transactions.each { |t| t._amount_cents_edited = false }
    end

    private

    def build_other_amount_cents(amount_cents:, size:)
      amount_cents / size
    end
  end
end
