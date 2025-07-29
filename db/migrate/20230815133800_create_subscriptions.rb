# frozen_string_literal: true

class CreateSubscriptions < ActiveRecord::Migration[7.0]
  def change
    create_table :subscriptions do |t|
      t.references :account, null: false, foreign_key: true
      t.string :processor_id, null: false, index: { unique: true }
      t.string :processor_plan_id
      t.string :processor_product_id
      t.string :status, null: false
      t.string :name, null: false
      t.boolean :cancel_at_period_end, null: false, default: false
      t.datetime :current_period_start, null: false
      t.datetime :current_period_end, null: false
      t.jsonb :data, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :subscriptions, %i[account_id processor_id]
  end
end
