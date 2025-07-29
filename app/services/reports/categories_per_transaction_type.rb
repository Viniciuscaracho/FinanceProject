# frozen_string_literal: true

module Reports
  class CategoriesPerTransactionType < ApplicationService
    include ReportsHelper
    def call
      params = context.params
      order = params.fetch(:order, nil)

      query = context.account.transactions.expenses

      query = query.filter_by(**params)
      query = query.where(transaction_type_cd: Transaction.transaction_types[context.transaction_type.to_sym])
      total = Money.from_cents(query.sum(:exchanged_amount_cents))

      query = query.order('domains.name ASC') if order.blank?

      items = query.categories_with_amount_to_hash
      items = items.sort_by { |_key, value| order == :asc ? value : -value }.to_h if order.present?

      chart_data = sanitize_chart_data( chart_data: sanitize_items(items:, order: ))

      context.result = [chart_data, items, total]
    end
  end
end
