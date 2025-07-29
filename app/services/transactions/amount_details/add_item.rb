# frozen_string_literal: true

module Transactions
  module AmountDetails
    class AddItem < ApplicationService
      def call
        context.transaction.children.build(
          account_id: context.transaction.account_id,
          bank_account_id: context.transaction.bank_account_id,
          kind: :child,
          due_date: context.transaction.due_date,
          transaction_type: context.transaction.transaction_type,
          name: context.transaction.name,
          contact: context.transaction.contact,
          category: context.transaction.category,
          cost_center: context.transaction.cost_center,
          amount_cents: context.amount_cents,
          tag_list: context.transaction.tag_list
        )
      end
    end
  end
end
