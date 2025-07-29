# frozen_string_literal: true

module Reports
  class PerPaymentMethod < ApplicationService
    def call
      params = context.params
      order = params.fetch(:order, nil)

      query = context.account.transactions.order(:payment_method_cd)
      query = revenue? ? query.revenues : query.expenses
      query = query.filter_by(**params)
      total = Money.from_cents(query.sum(:exchanged_amount_cents))

      items = query.payment_method_with_amount_to_hash
      items = items.transform_keys do |k|
        [{ name: I18n.t("enums.payment_method.#{Transaction.payment_methods.key(k)}"), payment_method_cd: k }, Transaction.payment_methods.key(k)]
      end
      items = items.sort_by { |_key, value| order == :asc ? value : -value }.to_h if order.present?

      chart_data = items.transform_keys { |key| key.first[:name] }

      context.result = [chart_data, items, total]
    end

    private

    def revenue?
      context.transaction_type == :revenue
    end
  end
end
