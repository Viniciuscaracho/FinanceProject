# frozen_string_literal: true

module Reports
  class Tags < ApplicationService
    include ReportsHelper

    def call
      params = context.params
      account = context.account

      query = account.transactions
      query = revenue? ? query.revenues : query.expenses

      query = query.filter_by(**params)
      total = Money.from_cents(query.sum(:exchanged_amount_cents))
      items = query.tags_with_amount_to_hash
      items = items.sort_by { |_key, value| params[:order] == :asc ? value : -value }.to_h if params[:order].present?

      chart_data = sanitize_chart_data(chart_data: sanitize_items(items:, order: params[:order]))

      context.result = [chart_data, items, total]
    end

    private

    def revenue?
      context.transaction_type == :revenue
    end
  end
end
