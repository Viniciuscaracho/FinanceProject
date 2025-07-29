# frozen_string_literal: true

class AddDescriptionToIntegrationStores < ActiveRecord::Migration[7.0]
  def change
    add_column :integration_stores, :type, :string
    add_column :integration_stores, :description, :text
  end
end
