# frozen_string_literal: true

# Fix connect token endpoint for pluggy
class ChangeConnectTokenEndpoint < ActiveRecord::Migration[7.0]
  def change
    pluggy = IntegrationStores::Pluggy.pluggy
    pluggy.upsert_endpoint(:connect_token, method: Net::HTTP::Post::METHOD, uri: '/connect_token')
  end
end
