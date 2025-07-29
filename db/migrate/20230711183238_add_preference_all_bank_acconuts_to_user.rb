class AddPreferenceAllBankAcconutsToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :preference_all_bank_accounts, :boolean, default: false
  end
end
