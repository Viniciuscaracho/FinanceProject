module Transactions
  module AmountDetails
    class RecalculateTotals < ApplicationService
      def call
        context.total_item_amount = Money.from_cents(context.transaction.amount_cents)
        context.total_sum_of_division = Money.from_cents(context.transaction.sum_children_amount_cents)
        context.remaining_sum_amount = context.total_item_amount - context.total_sum_of_division
      end
    end
  end
end
