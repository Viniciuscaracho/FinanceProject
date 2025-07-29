# frozen_string_literal: true

module Integrations
  # Fetch Pluggy accounts
  class PluggyItemSync < PluggySyncBase
    def call
      context.endpoint = :item
      initialize_vars
      result = @account.pluggy_client(endpoint_key: @endpoint)
      context.fail!(error: result.error) if result.failure?

      result = Integrations::UpsertRelationships.call(integration_store: @account_store, endpoint: @endpoint,
                                                      response: result.body, last_update: result.body[:updatedAt],
                                                      external_entity: @endpoint, external_id: result.body[:id],
                                                      active: true, sync_type: @sync_type)

      context.fail!(error: result.error) if result.failure?

      @account_store.upsert_config({ last_item_sync: Time.current.to_s })
    end
  end
end
