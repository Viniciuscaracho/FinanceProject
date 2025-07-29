# frozen_string_literal: true

# Initial configuration for pluggy integration
# Adds configuration and endpoints to the integration store
class AddPluggyStore < ActiveRecord::Migration[7.0]
  def up
    pluggy = IntegrationStore.create!(name: Integrations::Pluggy::NAME, store_type_cd: IntegrationStore::STORE_TYPES[:open_banking])
    pluggy.settings(:config).update!(pluggy_config)
    pluggy.upsert_endpoint(:token, method: Net::HTTP::Post::METHOD, uri: '/auth')
    pluggy.upsert_endpoint(:connect_token, method: Net::HTTP::Post::METHOD, uri: '/connect_token')
    pluggy.upsert_endpoint(:connectors, method: Net::HTTP::Get::METHOD, uri: '/connectors')
    pluggy.upsert_endpoint(:accounts, method: Net::HTTP::Get::METHOD, uri: '/accounts?itemId={{item_id}}')
    pluggy.upsert_endpoint(:account, method: Net::HTTP::Get::METHOD, uri: '/accounts/{{id}}')
    pluggy.upsert_endpoint(:transactions, method: Net::HTTP::Get::METHOD, uri: '/transactions?accountId={{account_id}}')
    pluggy.upsert_endpoint(:transaction, method: Net::HTTP::Get::METHOD, uri: '/transactions/{{id}}')
    pluggy.upsert_endpoint(:categories, method: Net::HTTP::Get::METHOD, uri: '/categories')
  end

  def down
    pluggy = IntegrationStore.find_by!(store_type_cd: IntegrationStore::STORE_TYPES[:open_banking], name: Integrations::Pluggy::NAME)
    pluggy.destroy!
  end

  private

  def pluggy_config
    {
      test: default_config,
      development: default_config,
      staging: default_config,
      production: default_config
    }
  end

  def default_config
    {
      api_key: nil,
      api_key_expires_at: nil,
      default_expiry: 2, # in hours
      client_id: Rails.application.credentials.dig(:pluggy, :client_id), # development id
      client_secret: Rails.application.credentials.dig(:pluggy, :client_secret), # development secret
      host: 'https://api.pluggy.ai',
      allowed_hosts: %w[127.0.0.1 localhost 177.71.238.212]
    }
  end
end
