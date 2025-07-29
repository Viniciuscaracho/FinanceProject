class AddNewIndexesToTransactions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    remove_index :transactions, :due_date, algorithm: :concurrently, if_exists: true
    remove_index :transactions, :transaction_type_cd, algorithm: :concurrently, if_exists: true
    remove_index :transactions, %i[account_id due_date], algorithm: :concurrently, name: 'index_transactions_on_account_and_due_date', if_exists: true
    remove_index :transactions, %i[kind_cd transaction_type_cd account_id due_date], algorithm: :concurrently, name: 'index_transactions_on_search', if_exists: true
    remove_index :transactions, %i[kind_cd transaction_type_cd account_id bank_account_id due_date], algorithm: :concurrently, name: 'index_transactions_on_search_bank_account', if_exists: true
    remove_index :transactions, %i[kind_cd transaction_type_cd account_id transfer_to_id due_date], algorithm: :concurrently, name: 'index_transactions_on_search_transfer_to', if_exists: true

    add_index :transactions, %i[kind_cd transaction_type_cd account_id bank_account_id due_date], order: { due_date: :desc }, name: 'index_transactions_on_search_bank_account', algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[kind_cd transaction_type_cd account_id transfer_to_id due_date], order: { due_date: :desc }, name: 'index_transactions_on_search_transfer_to', algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[kind_cd transaction_type_cd account_id due_date], order: { due_date: :desc }, name: 'index_transactions_on_search', algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[kind_cd transaction_type_cd account_id], name: 'index_transactions_on_search_without_due_date', algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[paid kind_cd transaction_type_cd account_id bank_account_id], order: { paid: :desc }, name: 'index_transactions_on_bank_acccount_balance', algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[paid kind_cd transaction_type_cd account_id transfer_to_id], order: { paid: :desc }, name: 'index_transactions_on_credit_balance', algorithm: :concurrently, if_not_exists: true

    add_index :transactions, %i[account_id due_date],            order: { due_date: :desc }, algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[account_id transaction_type_cd], algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[account_id category_id],         algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[account_id contact_id],          algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[account_id cost_center_id],      algorithm: :concurrently, if_not_exists: true
    add_index :transactions, %i[account_id id],                  order: { id: :desc }, algorithm: :concurrently, if_not_exists: true

    add_index :people, %i[discarded_at type account_id id],      algorithm: :concurrently, if_not_exists: true
    add_index :domains, %i[discarded_at type account_id id],     algorithm: :concurrently, if_not_exists: true
    add_index :bank_accounts, %i[account_id id],                 algorithm: :concurrently, if_not_exists: true
    add_index :document_templates, %i[type account_id id],       algorithm: :concurrently, if_not_exists: true
  end
end
