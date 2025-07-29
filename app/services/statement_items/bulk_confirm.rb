# frozen_string_literal: true

module StatementItems
  class BulkConfirm < ApplicationService
    def call
      ActiveRecord::Base.transaction do
        context.statement.statement_items.where(id: context.statement_item_ids).find_each do |statement_item|
          next if statement_item.transaction_type.blank?

          result = StatementItems::Confirm.call(statement_item:)
          return context.fail!(message: result.message, statement_item:) unless result.success?
        end
      end
    end
  end
end
