class AddAgencyToBankAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :bank_accounts, :agency, :string
    add_column :bank_accounts, :account_number, :string
  end
end
