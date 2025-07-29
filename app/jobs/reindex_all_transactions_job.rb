# frozen_string_literal: true

class ReindexAllTransactionsJob < ApplicationJob
  queue_as :scheduler

  def perform
    Transaction.find_in_batches { |group| reindex_range(group) }
  end

  def reindex_range(group)
    Transaction.reindex_range(group.first.id, group.last.id)
  end
end
