# frozen_string_literal: true

module Reports
  class Comparative < ApplicationService
    def call
      params = context.params
      account = context.account

      transactions = context.account.transactions.order(params[:date_type], :transaction_type_cd).filter_by(**params)
      transactions = transactions.includes(%i[category contact])

      bank_account_ids = params.fetch(:bank_account_ids, []).reject(&:blank?)
      bank_account_ids = context.account.bank_account_ids if bank_account_ids.empty?

      cost_center_ids = params.fetch(:cost_center_ids, []).reject(&:blank?)

      previous_balance = context.account.previous_balance_cents(
        date: params[:start_date],
        paid: true,
        bank_account_ids:,
        cost_center_ids:
      )

      transactions_revenues = transactions.revenues
      transactions_expenses = transactions.expenses
      transactions_fixed_expenses = transactions.fixed_expenses
      transactions_variable_expenses = transactions.variable_expenses
      transactions_taxes = transactions.taxes
      transactions_personnel_expenses = transactions.personnel_expenses

      transactions_transfers_in = account.transactions
                                          .transfers
                                          .includes(:bank_account, :transfer_to, :category, :contact)
                                          .by_paid(paid: params[:paid])
                                          .by_date_type(start_date: params[:start_date],
                                                        end_date: params[:end_date],
                                                        date_type: params[:date_type])
                                          .where(transfer_to_id: bank_account_ids)

      transactions_transfers_out = account.transactions
                                          .transfers
                                          .includes(:bank_account, :transfer_to, :category, :contact)
                                          .by_paid(paid: params[:paid])
                                          .by_date_type(start_date: params[:start_date],
                                                        end_date: params[:end_date],
                                                        date_type: params[:date_type])
                                          .where(bank_account_id: bank_account_ids)

      result = []
      result.concat(transactions_revenues, transactions_expenses, transactions_fixed_expenses,
                    transactions_variable_expenses, transactions_taxes, transactions_personnel_expenses,
                    transactions_transfers_in, transactions_transfers_out)


      sum_revenues = transactions_revenues.sum(:exchanged_amount_cents)
      sum_fixed_expenses = transactions_fixed_expenses.sum(:exchanged_amount_cents)
      sum_variable_expenses = transactions_variable_expenses.sum(:exchanged_amount_cents)
      sum_transactions_taxes = transactions_taxes.sum(:exchanged_amount_cents)
      sum_personnel_expenses = transactions_personnel_expenses.sum(:exchanged_amount_cents)
      sum_expenses = transactions_expenses.sum(:exchanged_amount_cents)

      transactions_transfer_in_sum = transactions_transfers_in.sum(:exchanged_amount_cents)
      transactions_transfer_out_sum = transactions_transfers_out.sum(:exchanged_amount_cents)
      transaction_transfer_total = (transactions_transfer_in_sum - transactions_transfer_out_sum)

      balance_period = (sum_revenues - sum_expenses)
      total_balance = (previous_balance + balance_period + transaction_transfer_total)

      context.result = [{
        transactions_revenues:,
        transactions_expenses:,
        transactions_fixed_expenses:,
        transactions_variable_expenses:,
        transactions_taxes:,
        transactions_personnel_expenses:,
        transactions_transfers_in:,
        transactions_transfers_out:,
        sum_revenues:,
        sum_fixed_expenses:,
        sum_variable_expenses:,
        sum_transactions_taxes:,
        sum_personnel_expenses:,
        sum_expenses:,
        previous_balance:,
        balance_period:,
        transactions_transfer_in_sum:,
        transactions_transfer_out_sum:,
        transaction_transfer_total:,
        total_balance:
      }, result]
    end
  end
end
