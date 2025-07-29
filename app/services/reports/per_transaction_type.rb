# frozen_string_literal: true

module Reports
  class PerTransactionType < ApplicationService
    def call
      params = context.params
      order = params.fetch(:order, nil)

      query = context.account.transactions.expenses.order(:transaction_type_cd)
      query = query.filter_by(**params)
      total = Money.from_cents(query.sum(:exchanged_amount_cents))

      items = query.transaction_type_with_amount_to_hash
      items = items.transform_keys do |k|
        [I18n.t("enums.transaction_type.#{Transaction.transaction_types.key(k)}"), Transaction.transaction_types.key(k)]
      end
      items = items.sort_by { |_key, value| order == :asc ? value : -value }.to_h if order.present?

      chart_data = items.transform_keys { |key| key.first }

      context.result = [chart_data, items, total]
    end
  end
end
