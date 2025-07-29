# frozen_string_literal: true

module Integrations
  # Sync Pluggy accounts
  class PluggyTransactionsSyncJob < ApplicationJob
    queue_as :integrations

    def perform(account_id, sync_type, params = {}, transaction_ids = [])
      result = Integrations::PluggyTransactionsSync.call(account_id:, sync_type:, params:, transaction_ids:)
      raise IntegrationError, result.error unless result.success?
    end
  end
end
