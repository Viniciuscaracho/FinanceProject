class AddCommissionPercentageToAccountUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :account_users, :commission_percentage, :decimal, precision: 8, scale: 2, default: 50.0, null: false
  end
end
