# frozen_string_literal: true

module Reports
  class PerPeriod < ApplicationService
    def call
      params = context.params
      order = params.fetch(:order, nil)
      same_month = params[:start_date].month == params[:end_date].month
      period = same_month ? :day : :month

      query = context.account.transactions
      query = revenue? ? query.revenues : query.expenses

      query = query.filter_by(**params)
      # Otimização: usar sum direto no banco
      total = Money.from_cents(query.sum(:exchanged_amount_cents) || 0)

      items = query.group_by_period(
        period,
        params[:date_type],
        format: period == :day ? I18n.t('date.formats.default') : I18n.t('date.formats.month'),
        time_zone: false,
        series: false
      ).sum(:exchanged_amount_cents)

      items = items.transform_values { |v| v.to_f / 100 }
      items = items.sort_by { |_key, value| order == :asc ? value : -value }.to_h if order.present?

      context.result = [items, total, same_month]
    end

    private

    def revenue?
      context.transaction_type == :revenue
    end
  end
end
