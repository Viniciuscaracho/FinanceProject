# frozen_string_literal: true

class UpdateTransactionsTsvBodyJob < ApplicationJob
  queue_as :reindexing

  def perform(account_id, column, value)
    return if account_id.blank? || column.blank? || value.blank?

    Transactions::Reindex.call(account_id:, column:, value:)
  end
end
