# frozen_string_literal: true

module Statements
  class Create < ApplicationService
    def call
      context.statement = context.current_account.statements.new(context.statement_params)
      return if context.statement.save

      add_fail_message(context.statement)
    end
  end
end
