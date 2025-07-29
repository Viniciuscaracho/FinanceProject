class AddConfiguredAtToIntegrationStores < ActiveRecord::Migration[7.0]
  def change
    add_column :integration_stores, :integrated_at, :datetime
    add_column :integration_stores, :state, :string

    add_index :integration_stores, :state
  end
end
