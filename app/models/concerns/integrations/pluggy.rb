# frozen_string_literal: true

# Integration module will be the main concern module for everything related to the integration store
module Integrations
  # Pluggy helper class
  module Pluggy
    extend ActiveSupport::Concern

    NAME = 'pluggy'

    included do
      # these static helper will make it easier to access the pluggy integration through console for maintenance
      def self.pluggy(account_id: nil, parent_id: nil)
        IntegrationStores::Pluggy.find_by(
          store_type_cd: IntegrationStore::STORE_TYPES[:open_banking],
          account_id:,
          parent_id:
        )
      end

      # for all the following methods, add pluggy_ prefix to avoid conflicts with other integrations
      def self.pluggy_config
        pluggy.config
      end

      def self.pluggy_endpoint(name)
        pluggy.endpoint(name)
      end

      def self.pluggy_account_store(account_id)
        global = pluggy
        account_store = pluggy(account_id:, parent_id: global.id)

        # if account_store is not found, create it
        if account_store.blank?
          account_store = IntegrationStores::Pluggy.create!(
            store_type_cd: IntegrationStore::STORE_TYPES[:open_banking],
            parent_id: global.id,
            account_id:
          )

          webhook_url = Rails.application.routes.url_helpers.webhooks_pluggy_account_url(account_id)
          if Rails.env.development?
            # replace the localhost url with the ngrok url when you are in development
            webhook_url = webhook_url.gsub('http://localhost:3000/', 'https://3e75-190-124-190-128.ngrok-free.app/')
          end
          account_store.upsert_config({ item_id: nil, last_accounts_sync: nil, last_transactions_sync: nil, webhook_url: })
        end
        account_store
      end

      def self.pluggy_token_payload
        config = pluggy_config
        {
          "clientId": config[:client_id],
          "clientSecret": config[:client_secret]
        }
      end

      def self.pluggy_auth_header(api_key:)
        {
          'X-API-KEY': api_key
        }
      end

      def self.pluggy_connect_token_payload(account_id:)
        account_store = pluggy_account_store(account_id)

        # item_id on this request only required for item updates
        item_id = account_store.config[:item_id]
        webhook_url = account_store.config[:webhook_url]
        {
          "itemId": item_id,
          "options": {
            "clientUserId": account_id.to_s,
            "webhookUrl": webhook_url
          }
        }
      end
    end
  end
end
