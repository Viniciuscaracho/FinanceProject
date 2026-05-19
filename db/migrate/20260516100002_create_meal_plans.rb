# frozen_string_literal: true

class CreateMealPlans < ActiveRecord::Migration[7.0]
  def change
    create_table :meal_plans do |t|
      t.bigint  :account_id,  null: false
      t.bigint  :contact_id,  null: false
      t.string  :title,       null: false
      t.text    :description
      t.text    :notes
      t.integer :status,      null: false, default: 0
      t.string  :public_token, null: false
      t.date    :start_date
      t.date    :end_date
      t.timestamps
    end

    add_index :meal_plans, :account_id
    add_index :meal_plans, :contact_id
    add_index :meal_plans, [:account_id, :contact_id]
    add_index :meal_plans, :public_token, unique: true
  end
end
