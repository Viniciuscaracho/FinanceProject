# frozen_string_literal: true

module Reports
  class Dre < ApplicationService
    def call
      params = context.params

      query = context.account.transactions.filter_by(**params)
      # Otimização: usar group e sum direto no banco (já otimizado)
      data = query.group(:transaction_type_cd).sum(:exchanged_amount_cents).to_h
      data = data.map { |k, v| [k, k.zero? ? v : -v] }.to_h

      gross_income = Money.from_cents(data.fetch(0, 0))
      taxes = Money.from_cents(data.fetch(4, 0))
      variable_expense = Money.from_cents(data.fetch(2, 0))
      fixed_expense = Money.from_cents(data.fetch(1, 0))
      payroll = Money.from_cents(data.fetch(3, 0))

      gross_profit = gross_income + taxes
      operating_profit = gross_profit + variable_expense
      result = operating_profit + payroll + fixed_expense
      percentage_month = CalculationsHelper.calculate_percentage(result, gross_profit)

      context.result = {
        gross_income:,
        taxes:,
        variable_expense:,
        fixed_expense:,
        payroll:,
        gross_profit:,
        operating_profit:,
        result:,
        percentage_month:
      }
    end
  end
end
