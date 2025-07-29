class AddMultisearchIndexToTransactions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :transactions, %i[kind_cd account_id bank_account_id due_date],
              order: { due_date: :desc },
              algorithm: :concurrently,
              name: 'index_transactions_on_multisearch_columns'

    add_index :bank_accounts, %i[discarded_at account_id],
              order: { discarded_at: 'ASC NULLS FIRST' },
              algorithm: :concurrently,
              name: 'index_bank_accounts_on_multisearch_columns'
  end
end
