class AddBalanceToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :balance_cents, :bigint, null: false, default: 0
    add_column :accounts, :balance_currency, :string, limit: 3, null: false, default: 'BRL'
  end
end
