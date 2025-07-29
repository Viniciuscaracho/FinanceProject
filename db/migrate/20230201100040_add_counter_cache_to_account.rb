class AddCounterCacheToAccount < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :account_users_count, :integer
    add_column :accounts, :account_invitations_count, :integer
    add_column :accounts, :bank_accounts_count, :integer
    add_column :accounts, :contacts_count, :integer
    add_column :accounts, :categories_count, :integer
    add_column :accounts, :cost_centers_count, :integer
    add_column :accounts, :transactions_count, :integer
  end
end
