# frozen_string_literal: true

class AddNutritionTargetsAndFoodBrand < ActiveRecord::Migration[7.0]
  def change
    add_column :meal_plans, :target_kcal,      :decimal, precision: 8, scale: 2, default: 0
    add_column :meal_plans, :target_protein_g, :decimal, precision: 8, scale: 2, default: 0
    add_column :meal_plans, :target_carbs_g,   :decimal, precision: 8, scale: 2, default: 0
    add_column :meal_plans, :target_fat_g,     :decimal, precision: 8, scale: 2, default: 0
    add_column :meal_plans, :target_fiber_g,   :decimal, precision: 8, scale: 2, default: 0

    add_column :foods, :brand, :string
  end
end
