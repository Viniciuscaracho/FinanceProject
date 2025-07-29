# frozen_string_literal: true

module Transactions
  module AmountDetails
    class Destroy < ApplicationService
      include Transactions

      def call
        context.transaction.kind = :simple
        context.transaction.children.destroy_all
        context.transaction.paid_amount_cents = 0
        dispatch_event if context.transaction.save
      end

      private

      def dispatch_event
        # publish 'transaction_updated', transaction: context.transaction
      end
    end
  end
end
