# frozen_string_literal: true

class CreateOffers < ActiveRecord::Migration[7.0]
  def change
    create_table :offers do |t|
      t.references :account, null: false, foreign_key: true
      t.references :economic_activity, null: true, foreign_key: { to_table: :enums }
      t.string :type, null: false
      # t.string :offer_type
      t.string :internal_code
      t.string :name, null: false
      t.text :description
      t.string :unit
      t.string :sale_amount_cents, null: false, default: 0
      t.string :purchase_amount_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.jsonb :data, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.string :enabled, null: false, default: true

      t.timestamps
      t.datetime :discarded_at
    end

    add_index :offers, %i[account_id type]
    add_index :offers, %i[account_id internal_code]
    add_index :offers, %i[account_id enabled]
    add_index :offers, %i[account_id discarded_at]
  end
end
