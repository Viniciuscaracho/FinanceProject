# frozen_string_literal: true

class AddItemEndpointToPluggy < ActiveRecord::Migration[7.0]
  def change
    pluggy = IntegrationStores::Pluggy.pluggy
    pluggy.upsert_endpoint(:item, { method: Net::HTTP::Get::METHOD, uri: '/items/{{item_id}}' })
  end
end
