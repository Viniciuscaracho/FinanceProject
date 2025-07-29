# frozen_string_literal: true

module StatementItems
  class NewOne < ApplicationService
    def call
      return if context.statement_item.update(update_params)

      add_fail_message(context.statement_item)
    end

    private

    def update_params
      {
        transaction_type: context.statement_item.type == 'credit' ? :revenue : :variable_expense,
        name: context.statement_item.memo,
        status: :new,
        ignored_at: nil,
        confirmed_at: nil,
        contact: nil,
        category: nil,
        bank_account_source: nil,
        bank_account_target: nil,
        related_transaction: nil
      }
    end
  end
end
