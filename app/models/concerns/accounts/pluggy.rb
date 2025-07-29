# frozen_string_literal: true

module Accounts
  # Pluggy helper class for account
  module Pluggy
    extend ActiveSupport::Concern

    included do
      def pluggy_store
        IntegrationStores::Pluggy.pluggy_account_store(id)
      end

      def pluggy_client(endpoint_key:, params: {})
        Integrations::PluggyClient.call(account_id: id, endpoint_key:, params:)
      end

      def pluggy_webhooks
        pluggy_relationships(external_entity: 'webhooks')
      end

      def pluggy_item
        pluggy_relationships(external_entity: 'item')
      end

      def pluggy_accounts
        pluggy_relationships(external_entity: 'accounts')
      end

      def pluggy_transactions(parent_account: nil)
        # check if parent_account is a RelationshipStore
        if parent_account.is_a?(RelationshipStore)
          parent_account.child_relationships.where(external_entity: 'transactions')
        else
          pluggy_relationships(external_entity: 'transactions')
        end
      end

      private

      def pluggy_relationships(external_entity: nil)
        pluggy_store.relationship_stores.where(external_entity:)
      end
    end
  end
end
