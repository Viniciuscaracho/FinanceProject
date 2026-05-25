# frozen_string_literal: true

class AddFiberAndVitaminsToNutrition < ActiveRecord::Migration[7.0]
  def change
    add_column :meal_foods, :fiber_snapshot, :decimal, precision: 8, scale: 2, default: 0.0

    add_column :foods, :vitamins_per_100g, :jsonb, default: {}
    add_column :meal_foods, :vitamins_snapshot, :jsonb, default: {}
  end
end
