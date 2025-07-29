class RecreateMainIndexesFromTransactions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    remove_index :transactions, %i[account_id kind_cd transaction_type_cd due_date bank_account_id], name: 'index_transactions_on_search_filter', if_exists: true
    remove_index :transactions, %i[account_id kind_cd bank_account_id paid due_date], name: 'index_transactions_on_balance_bank_account', if_exists: true
    remove_index :transactions, %i[account_id kind_cd transfer_to_id paid due_date], name: 'index_transactions_on_balance_transfer_to', if_exists: true
    remove_index :transactions, :paid, name: 'index_transactions_on_paid', if_exists: true

    # Search indexes
    add_index :transactions, %i[kind_cd transaction_type_cd account_id bank_account_id due_date], name: 'index_transactions_on_search_bank_account', algorithm: :concurrently
    add_index :transactions, %i[kind_cd transaction_type_cd account_id transfer_to_id due_date], name: 'index_transactions_on_search_transfer_to', algorithm: :concurrently

    # Paid index
    add_index :transactions, %i[account_id paid], name: 'index_transactions_on_paid', algorithm: :concurrently
  end
end
