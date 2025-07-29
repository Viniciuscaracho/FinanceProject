# frozen_string_literal: true

module StatementItems
  class Confirm < ApplicationService
    def call
      return if context.statement_item.update(update_params)

      add_fail_message(context.statement_item)
    end

    private

    def update_params
      {
        due_date: context.statement_item.posted_at,
        status: :confirmed,
        confirmed_at: Time.current,
        ignored_at: nil
      }
    end
  end
end
