# frozen_string_literal: true

module Integrations
  # Sync Pluggy accounts
  class PluggyItemSyncJob < ApplicationJob
    queue_as :integrations

    def perform(account_id, sync_type)
      result = Integrations::PluggyItemSync.call(account_id: account_id, sync_type: sync_type)
      raise IntegrationError, result.error unless result.success?
    end
  end
end
