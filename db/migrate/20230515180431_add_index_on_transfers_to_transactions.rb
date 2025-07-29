class AddIndexOnTransfersToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_index :transactions, %i[account_id kind_cd bank_account_id paid due_date], name: 'index_transactions_on_balance_bank_account'
    add_index :transactions, %i[account_id kind_cd transfer_to_id paid due_date], name: 'index_transactions_on_balance_transfer_to'
  end
end
