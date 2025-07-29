class AddPersonalToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :account_type_cd, :integer, null: false, default: 0
  end
end
