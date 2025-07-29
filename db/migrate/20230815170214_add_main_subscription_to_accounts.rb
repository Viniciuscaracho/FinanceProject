class AddMainSubscriptionToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_reference :accounts, :subscription, null: true, foreign_key: true
    add_column :accounts, :suspended, :boolean, null: false, default: false
  end
end
