# frozen_string_literal: true

module Transactions
  class DetailedExpenses < ApplicationService
    def call
      query = context.account.transactions.expenses.only_simple_and_children.where(due_date: context.period)
      query = if context.bank_account.present?
                query.where(bank_account: context.bank_account)
              else
                query.where(bank_account: context.account.bank_accounts.kept)
              end

      result = query.group(:transaction_type_cd, :paid).sum(:exchanged_amount_cents)

      details_expenses = {}
      (Transaction.transaction_types.values - [0, 5]).each do |value|
        details_expenses[value] = { total_paid: 0, total: 0 }
      end

      result.each do |((transaction_type_cd, paid), amount_cents)|
        details_expenses[transaction_type_cd] ||= { total_paid: 0, total: 0 }
        details_expenses[transaction_type_cd][:total] += amount_cents
        details_expenses[transaction_type_cd][:total_paid] += amount_cents if paid
      end

      context.result = details_expenses
    end
  end
end
