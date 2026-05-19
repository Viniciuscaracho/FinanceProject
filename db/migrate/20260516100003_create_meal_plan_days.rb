# frozen_string_literal: true

class CreateMealPlanDays < ActiveRecord::Migration[7.0]
  def change
    create_table :meal_plan_days do |t|
      t.bigint  :meal_plan_id, null: false
      t.integer :day_number,   null: false
      t.string  :label
      t.timestamps
    end

    add_index :meal_plan_days, :meal_plan_id
    add_index :meal_plan_days, [:meal_plan_id, :day_number], unique: true
  end
end
