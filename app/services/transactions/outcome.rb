# frozen_string_literal: true

module Transactions
  class Outcome < ApplicationService
    def call
      query = context.account.transactions.only_simple_and_children.where(
        due_date: context.period
      )

      query = query.where(bank_account: context.bank_account) if context.bank_account.present?

      revenues_sum = Money.from_cents(query.revenues.sum(:exchanged_amount_cents))
      expenses_sum = Money.from_cents(query.expenses.sum(:exchanged_amount_cents))

      context.result = (revenues_sum - expenses_sum)
    end
  end
end
