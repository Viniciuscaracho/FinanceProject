# frozen_string_literal: true

module Integrations
  # Base hooks processor for Pluggy
  class PluggyHooks < ApplicationService
    def call
      initialize_vars
      process_hook
    end

    private

    def initialize_vars
      @account = context.account
      @account_store = @account.pluggy_store
      @payload = context.payload.with_indifferent_access
    end

    def trigger_waiting_user_input
      @account_store.upsert_config({ waiting_user_input: true })
    end

    def trigger_login_succeeded
      @account_store.upsert_config({ waiting_user_input: false })
      @account_store.upsert_config({ login_succeeded: true })
    end

    def trigger_item_updated
      from = (Time.current - 7.days).strftime('%Y-%m-%d')
      params = { transactions: { query: { from: }}}
      Integrations::PluggySyncAllJob.perform_later(@account.id, RelationshipStore::SYNC_TYPES[:webhook_sync], params)
    end

    def trigger_item_created
      @account_store.upsert_config({ item_id: @payload[:itemId] })
      Integrations::PluggySyncAllJob.perform_later(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync])
    end

    def trigger_item_deleted
      @account_store.upsert_config({ item_id: nil, item_deleted_at: Time.current.to_s })
    end

    def trigger_transactions_deleted
      @account_store.upsert_config({ last_transactions_deletion: Time.current.to_s })
      Integrations::PluggyTransactionsSyncJob.perform_later(@account.id, RelationshipStore::SYNC_TYPES[:webhook_sync], {}, @payload[:transactionIds])
    end

    def process_hook
      audit_events
      case @payload[:event]
      when 'item/waiting_user_input'
        trigger_waiting_user_input
      when 'item/login_succeeded'
        trigger_login_succeeded
      when 'item/created'
        trigger_item_created
      when 'item/updated'
        trigger_item_updated
      when 'transactions/deleted'
        trigger_transactions_deleted
      when 'item/deleted'
        trigger_item_deleted
      when 'item/error', 'connector/status_updated'
        # this are webhooks that we don't need/know how to process for now
        # we can add more functionality here if needed
        # see https://docs.pluggy.ai/docs/webhooks
      else
        context.fail!(error: 'Invalid hook event')
      end
    end

    def audit_events
      # log the webhooks event into the relationship store
      # maybe not the best place to do this, but it works for now
      Integrations::UpsertRelationships.call(integration_store: @account_store, endpoint: :webhooks,
                                             response: @payload, last_update: Time.current.to_s,
                                             external_entity: :webhooks, external_id: @payload[:eventId],
                                             sync_type: RelationshipStore::SYNC_TYPES[:webhook_sync])
    end
  end
end
