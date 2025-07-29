# frozen_string_literal: true

module StatementItems
  class Reset < ApplicationService
    def call
      return if context.statement_item.update(update_params)

      add_fail_message(context.statement_item)
    end

    private

    def update_params
      {
        status: context.statement_item.related_transaction_id.present? ? :suggested : :new,
        ignored_at: nil,
        confirmed_at: nil
      }
    end
  end
end
