# frozen_string_literal: true

class CreateIntegrationStores < ActiveRecord::Migration[7.0]
  def change
    create_table :integration_stores do |t|
      t.string :name, null: false
      t.integer :store_type_cd, null: false
      t.references :account, null: true, foreign_key: true
      t.references :parent, null: true

      t.timestamps
    end

    add_index :integration_stores, %i[name store_type_cd account_id], unique: true, name: 'idx_integrations_stores_uniq'
  end
end
