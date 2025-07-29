# frozen_string_literal: true

module Transactions
  class Expenses < ApplicationService
    def call
      query = context.account.transactions.only_simple_and_children.where(
        due_date: context.period
      )

      query = query.where(transaction_type_cd: context.transaction_type_cd) if context.transaction_type_cd.present?
      query = if context.bank_account.present?
                query.where(bank_account: context.bank_account)
              else
                query.where(bank_account: context.account.bank_accounts.kept)
              end

      paid_expenses = Money.from_cents(query.paid_expenses.sum(:exchanged_amount_cents))
      expected_expenses = Money.from_cents(query.expenses.sum(:exchanged_amount_cents))
      percentage = CalculationsHelper.calculate_percentage(paid_expenses.to_f, expected_expenses.to_f)

      context.result = [paid_expenses, expected_expenses, percentage]
    end
  end
end
