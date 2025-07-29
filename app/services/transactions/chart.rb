# frozen_string_literal: true

module Transactions
  class Chart < ApplicationService
    def call
      Groupdate.time_zone = false

      result = context.account.transactions.only_simple_and_children.ignore_transfers.where(
        due_date: context.range_of_months
      )

      result = if context.bank_account.present?
                 result.where(bank_account: context.bank_account)
               else
                 result.where(bank_account: context.account.bank_accounts.kept)
               end

      result = result.group_by_period(
        context.period,
        :due_date,
        series: true,
        format: I18n.t('time.formats.month')
      )
      result = result.group(:transaction_type_cd, :paid)
                     .order(:transaction_type_cd, :paid)
                     .sum(:exchanged_amount_cents)

      column_data = {
        paid_revenues: build_paid_revenues(result),
        unpaid_revenues: build_unpaid_revenues(result),
        paid_expenses: build_paid_expenses(result),
        unpaid_expenses: build_unpaid_expenses(result)
      }
      line_data = build_line_data(column_data)

      context.result = [column_data, line_data]
    end

    private

    def build_paid_revenues(result)
      result.select { |k, _v| k.second.zero? && k.last }.map { |k, v| { month: k.first, value: v } }
    end

    def build_unpaid_revenues(result)
      result.select { |k, _v| k.second.zero? && !k.last }.map { |k, v| { month: k.first, value: v } }
    end

    def build_paid_expenses(result)
      result.select { |k, _v| [1, 2, 3, 4].include?(k.second) && k.last }
            .map { |k, v| { month: k.first, value: v } }
            .group_by { |d| d[:month] }
            .map { |k, array| { month: k, value: -array.pluck(:value).inject(&:+) } }
    end

    def build_unpaid_expenses(result)
      result.select { |k, _v| [1, 2, 3, 4].include?(k.second) && !k.last }
            .map { |k, v| { month: k.first, value: v } }
            .group_by { |d| d[:month] }
            .map { |k, array| { month: k, value: -array.pluck(:value).inject(&:+) } }
    end

    def build_line_data(column_data)
      line_data = []
      column_data.map { |_k, v| v }.each { |array| array.each { |item| line_data << item } }
      line_data.group_by { |d| d[:month] }
               .map { |k, array| { month: k, value: array.pluck(:value).inject(&:+) } }
    end
  end
end
