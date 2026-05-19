# frozen_string_literal: true

class CreateFoods < ActiveRecord::Migration[7.0]
  def change
    create_table :foods do |t|
      t.bigint  :account_id
      t.string  :name,            null: false
      t.decimal :kcal_per_100g,   precision: 8, scale: 2, default: 0
      t.decimal :protein_per_100g, precision: 8, scale: 2, default: 0
      t.decimal :carbs_per_100g,  precision: 8, scale: 2, default: 0
      t.decimal :fat_per_100g,    precision: 8, scale: 2, default: 0
      t.decimal :fiber_per_100g,  precision: 8, scale: 2, default: 0
      t.string  :source,          null: false, default: 'custom'
      t.string  :external_id
      t.timestamps
    end

    add_index :foods, :account_id
    add_index :foods, :source
    add_index :foods, :name
  end
end
