# frozen_string_literal: true

module Reports
  class HistoryExpensesPerType < ApplicationService

    DATE_SIZE = {
      year: 397, # 1 ANO + 1 MES + 1 DIA ( ANO BISSEXTO), PARA PODER SELECIONAR 1/01/2021 ATE 31/01/2021
      month: 31
    }.freeze

    YEAR = :year
    MONTH = :month
    DAY = :day


    def call
      account = context.account
      params = context.params

      transactions = account.transactions.expenses
      transactions = transactions.filter_by(**params)

      period = transactions.order(params[:date_type])
      period = transactions.any? ? period.first&.date_by_type(date_type: params[:date_type])..period.last&.date_by_type(date_type: params[:date_type]) : return

      all_transactions_hash = build_all_transactions_hash(period:, transactions:, params:)

      chart_data = [{ name: I18n.t('transactions.expenses.expenses'), data: all_transactions_hash }]

      total = all_transactions_hash.values

      transactions_hash = transactions.order(:transaction_type_cd, params[:date_type]).transaction_types.each_pair.with_object({}) do |(key, value), object|
        next if key == 'transfer' || key == 'revenue'

        group_period = group_period(period:)

        object[key] = transactions.where(transaction_type_cd: value).group_by_period(group_period, params[:date_type], time_zone: false, range: period).sum(:exchanged_amount_cents)

      end

      formatted_period = period_format(period:)

      context.result = [chart_data, transactions_hash, formatted_period, total]
    end

    def revenue?
      context.transaction_type == :revenue
    end

    def period_format(period:)
      if period.count > DATE_SIZE[:year]
        transform_period_into_year(period:)

      elsif period.count > DATE_SIZE[:month]
        transform_period_into_months(period:)

      else
        period.map { |it| it.strftime("%d/%m/%Y") }
      end
    end

    def transform_period_into_year(period:)
      period = period.map do |day|
        day.strftime("%Y")
      end
      period.uniq
    end

    def transform_period_into_months(period:)
      period = period.map do |day|
        day.strftime("%m/%Y")
      end

      period.uniq
    end

    def group_period(period:)
      if period.count > DATE_SIZE[:year]
        YEAR
      elsif period.count > DATE_SIZE[:month]
        MONTH
      else
        DAY
      end
    end

    def build_all_transactions_hash(period:, transactions:, params:)
      if period.count > DATE_SIZE[:year]
        transactions.years_with_amount_to_hash(date_type: params[:date_type])
                    .map { |k, v| { k.strftime("%Y") => v.to_f / 100 } }
                    .reduce({}, :merge)
      elsif period.count > DATE_SIZE[:month]
        transactions.months_with_amount_to_hash(date_type: params[:date_type])
                    .map { |k, v| { k.strftime("%m/%Y") => v.to_f / 100 } }
                    .reduce({}, :merge)
      else
        transactions.days_with_amount_to_hash(date_type: params[:date_type])
                    .map { |k, v| { k.strftime("%m/%d/%Y") => v.to_f / 100}}
                    .reduce({}, :merge)
      end
    end

  end
end
