# frozen_string_literal: true

class CreateMeals < ActiveRecord::Migration[7.0]
  def change
    create_table :meals do |t|
      t.bigint  :meal_plan_day_id, null: false
      t.string  :name,             null: false
      t.string  :time_suggestion
      t.text    :notes
      t.integer :position,         null: false, default: 0
      t.timestamps
    end

    add_index :meals, :meal_plan_day_id
    add_index :meals, [:meal_plan_day_id, :position]
  end
end
