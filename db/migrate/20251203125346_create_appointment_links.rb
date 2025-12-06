# frozen_string_literal: true

class CreateAppointmentLinks < ActiveRecord::Migration[7.0]
  def change
    create_table :appointment_links do |t|
      t.references :account, null: false, foreign_key: true
      t.string :token, null: false, index: { unique: true }
      t.string :name
      t.text :description
      t.boolean :active, default: true, null: false
      t.references :service, null: true, foreign_key: { to_table: :offers }
      t.references :account_user, null: true, foreign_key: true
      t.jsonb :settings, default: {}
      
      t.timestamps
    end
    
    add_index :appointment_links, :active
  end
end

