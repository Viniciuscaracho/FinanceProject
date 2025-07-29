# frozen_string_literal: true

class CreateRelationshipStores < ActiveRecord::Migration[7.0]
  def change
    create_table :relationship_stores do |t|
      t.string :endpoint
      t.string :external_entity, null: false
      t.string :external_id, null: false
      t.string :internal_entity
      t.bigint :internal_id
      t.datetime :source_last_update
      t.integer :sync_type_cd, null: false
      t.datetime :synced_at
      t.references :integration_store, null: false, foreign_key: true
      t.references :account, null: true, foreign_key: true
      t.references :synced_by, null: true, foreign_key: { to_table: :users }
      t.jsonb :raw_data
      t.jsonb :extras

      t.timestamps
    end

    add_index :relationship_stores, :sync_type_cd
    add_index :relationship_stores, %i[external_entity external_id]
    add_index :relationship_stores, %i[internal_entity internal_id]
  end
end
