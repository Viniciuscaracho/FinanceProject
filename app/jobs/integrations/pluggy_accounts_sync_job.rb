# frozen_string_literal: true

module Integrations
  # Sync Pluggy accounts
  class PluggyAccountsSyncJob < ApplicationJob
    queue_as :integrations

    def perform(account_id, sync_type)
      result = Integrations::PluggyAccountsSync.call(account_id:, sync_type:)
      raise IntegrationError, result.error unless result.success?
    end
  end
end
