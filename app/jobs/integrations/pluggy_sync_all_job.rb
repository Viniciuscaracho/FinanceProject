# frozen_string_literal: true

module Integrations
  # Sync Pluggy accounts
  class PluggySyncAllJob < ApplicationJob
    queue_as :integrations

    def perform(account_id, sync_type, params = default_params)
      # the sequential sync here matters since we need the accounts to sync the transactions
      Integrations::PluggyItemSyncJob.perform_now(account_id, sync_type)
      Integrations::PluggyAccountsSyncJob.perform_now(account_id, sync_type)
      Integrations::PluggyTransactionsSyncJob.perform_now(account_id, sync_type, params[:transactions])
    end

    private

    def default_params
      { transactions: {}, accounts: {}, item: {} }
    end
  end
end
