# frozen_string_literal: true

module Integrations
  # Sync Pluggy accounts
  class PluggySyncBase < ApplicationService

    protected

    def initialize_vars
      @account = Account.find(context.account_id)
      @account_store = @account.pluggy_store
      @config = @account_store.config
      @endpoint = context.endpoint
      @sync_type = context.sync_type
      @params = context.params || {}
      @transaction_ids = context.transaction_ids || []

      # the item_id presence means the account is connected to Pluggy
      # we probably should change this later if we want to connect to multiple banks
      context.fail!(error: "Account #{context.account_id} not connected to Pluggy") if @config[:item_id].blank?
    end

    def upsert_relationships(response:, last_update:, tied_to: nil)
      Integrations::BatchUpsertRelationships.call(
        integration_store: @account_store,
        endpoint: @endpoint,
        response:,
        last_update:,
        active_check: false,
        external_entity: @endpoint,
        external_id: :id,
        sync_type: @sync_type,
        tied_to:
      )
    end
  end
end
