# frozen_string_literal: true

module StatementItems
  class Ignore < ApplicationService
    def call
      return if context.statement_item.update(update_params)

      add_fail_message(context.statement_item)
    end

    private

    def update_params
      {
        status: :ignored,
        ignored_at: Time.current,
        confirmed_at: nil
      }
    end
  end
end
