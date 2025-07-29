class AddChangeUniqIndexToIntegrationStores < ActiveRecord::Migration[7.0]
  def change
    remove_index :integration_stores, %i[name store_type_cd account_id], unique: true, name: 'idx_integrations_stores_uniq'

    add_index :integration_stores, %i[type store_type_cd account_id], unique: true, name: 'idx_integrations_stores_uniq'
  end
end
