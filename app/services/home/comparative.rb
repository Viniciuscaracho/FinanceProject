# frozen_string_literal: true

module Home
  class Comparative < ApplicationService
    include CalculationsHelper
    def call
      this_month = build_this_month
      last_month = build_last_month
      comparison = build_comparison(this_month, last_month)
      percentages = {
        revenues: calculate_percentage(this_month[:revenues],          last_month[:revenues]),
        expenses: calculate_percentage(this_month[:expenses],          last_month[:expenses]),
        fixed_expenses: calculate_percentage(this_month[:fixed_expenses], last_month[:fixed_expenses]),
        variable_expenses: calculate_percentage(this_month[:variable_expenses], last_month[:variable_expenses]),
        payroll: calculate_percentage(this_month[:payroll], last_month[:payroll]),
        taxes: calculate_percentage(this_month[:taxes], last_month[:taxes])
      }

      context.result = [this_month, last_month, comparison, percentages]
    end

    def build_this_month
      transactions = context.account
                            .transactions
                            .this_month
                            .only_simple_and_children

      transactions = if context.bank_account.present?
                       transactions.where(bank_account: context.bank_account)
                     else
                       transactions.where(bank_account: context.account.bank_accounts.kept)
                     end
      {
        revenues: transactions.revenues.sum(:exchanged_amount_cents),
        expenses: transactions.expenses.sum(:exchanged_amount_cents),
        fixed_expenses: transactions.fixed_expenses.sum(:exchanged_amount_cents),
        variable_expenses: transactions.variable_expenses.sum(:exchanged_amount_cents),
        payroll: transactions.personnel_expenses.sum(:exchanged_amount_cents),
        taxes: transactions.taxes.sum(:exchanged_amount_cents)
      }
    end

    def build_last_month
      transactions = context.account
                            .transactions
                            .last_month
                            .only_simple_and_children

      transactions = if context.bank_account.present?
                       transactions.where(bank_account: context.bank_account)
                     else
                       transactions.where(bank_account: context.account.bank_accounts.kept)
                     end

      {
        revenues: transactions.revenues.sum(:exchanged_amount_cents),
        expenses: transactions.expenses.sum(:exchanged_amount_cents),
        fixed_expenses: transactions.fixed_expenses.sum(:exchanged_amount_cents),
        variable_expenses: transactions.variable_expenses.sum(:exchanged_amount_cents),
        payroll: transactions.personnel_expenses.sum(:exchanged_amount_cents),
        taxes: transactions.taxes.sum(:exchanged_amount_cents)
      }
    end

    def build_comparison(this_month, last_month)
      {
        revenues: this_month[:revenues] - last_month[:revenues],
        expenses: this_month[:expenses] - last_month[:expenses],
        fixed_expenses: this_month[:fixed_expenses] - last_month[:fixed_expenses],
        variable_expenses: this_month[:variable_expenses] - last_month[:variable_expenses],
        payroll: this_month[:payroll] - last_month[:payroll],
        taxes: this_month[:taxes] - last_month[:taxes]
      }
    end
  end
end
