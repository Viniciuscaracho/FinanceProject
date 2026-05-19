# frozen_string_literal: true

class CreateMealFoods < ActiveRecord::Migration[7.0]
  def change
    create_table :meal_foods do |t|
      t.bigint  :meal_id,          null: false
      t.bigint  :food_id,          null: false
      t.decimal :quantity,         precision: 8, scale: 2, null: false, default: 100
      t.string  :unit,             null: false, default: 'g'
      t.text    :notes
      t.decimal :kcal_snapshot,    precision: 8, scale: 2, default: 0
      t.decimal :protein_snapshot, precision: 8, scale: 2, default: 0
      t.decimal :carbs_snapshot,   precision: 8, scale: 2, default: 0
      t.decimal :fat_snapshot,     precision: 8, scale: 2, default: 0
      t.integer :position,         null: false, default: 0
      t.timestamps
    end

    add_index :meal_foods, :meal_id
    add_index :meal_foods, :food_id
  end
end
