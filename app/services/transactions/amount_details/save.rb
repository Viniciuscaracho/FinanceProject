# frozen_string_literal: true

module Transactions
  module AmountDetails
    class Save < ApplicationService
      def call
        context.transaction.update(category: nil, cost_center: nil, contact_id: nil) if context.transaction.detailed?
        context.transaction.paid_amount_cents = context.transaction.sum_children_paid_amount_cents
        if context.update_transaction_amount
          context.transaction.amount_cents = context.transaction.sum_children_amount_cents
        end

        context.transaction.paid = context.transaction.all_children_paid?
        return if context.transaction.save

        context.fail!(error: context.transaction.errors.full_messages.first)
      end
    end
  end
end
