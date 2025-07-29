# frozen_string_literal: true

class AddTypeToPaymentPlans < ActiveRecord::Migration[7.0]
  def change
    add_column :payment_plans, :type_cd, :integer, null: false, default: 0
    add_index :payment_plans, %i[account_id type_cd]
  end
end
