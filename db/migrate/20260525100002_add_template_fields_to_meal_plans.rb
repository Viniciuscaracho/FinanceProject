# frozen_string_literal: true

class AddTemplateFieldsToMealPlans < ActiveRecord::Migration[7.0]
  def change
    add_column :meal_plans, :is_template, :boolean, default: false, null: false
    add_column :meal_plans, :template_category, :string

    change_column_null :meal_plans, :contact_id, true

    add_index :meal_plans, :is_template
  end
end
