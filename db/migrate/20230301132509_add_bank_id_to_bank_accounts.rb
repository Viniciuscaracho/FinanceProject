class AddBankIdToBankAccounts < ActiveRecord::Migration[7.0]
  def change
    add_reference :bank_accounts, :bank, null: true, foreign_key: true
  end
end
