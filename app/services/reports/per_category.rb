# frozen_string_literal: true

module Reports
  class PerCategory < ApplicationService
    include ReportsHelper
    def call
      params = context.params
      order = params.fetch(:order, nil)

      query = context.account.transactions
      query = revenue? ? query.revenues : query.expenses

      query = query.filter_by(**params)
      total = Money.from_cents(query.sum(:exchanged_amount_cents))
      items = query.categories_with_amount_to_hash
      items = items.sort_by { |_key, value| order == :asc ? value : -value }.to_h if order.present?

      chart_data = sanitize_chart_data(chart_data: sanitize_items(items:, order: ))

      context.result = [chart_data, items, total]
    end

    private

    def revenue?
      context.transaction_type == :revenue
    end
  end
end
