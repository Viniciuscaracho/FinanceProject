# frozen_string_literal: true

module Reports
  class TransactionsPerCostCenter < ApplicationService
    include ReportsHelper
    def call
      params = context.params
      order = params.fetch(:order, nil)

      query = context.account.transactions
      query = revenue? ? query.revenues : query.expenses
      query = query.filter_by(**params)
      query = query.where(cost_center_id: context.cost_center_id)
      total = Money.from_cents(query.sum(:exchanged_amount_cents))

      query = if order.present?
                query.order(exchanged_amount_cents: order)
              else
                query.order(due_date: :asc)
              end

      chart_data = Hash.new(0)

      query.each do |transaction|
        name = transaction.name.presence || I18n.t('shared.not_informed_female')
        chart_data[name] += transaction.exchanged_amount_cents.to_f / 100
      end

      chart_data = sanitize_chart_data( chart_data: sanitize_items(items: chart_data, order: ))

      context.result = [chart_data, query, total]
    end

    private

    def revenue?
      context.transaction_type == :revenue
    end
  end
end
