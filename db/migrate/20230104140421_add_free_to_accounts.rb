class AddFreeToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :free, :boolean, null: false, default: false
    add_column :accounts, :trial, :boolean, null: false, default: false
  end
end
