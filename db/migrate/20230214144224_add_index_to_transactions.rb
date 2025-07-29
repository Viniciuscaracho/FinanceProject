class AddIndexToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_index :transactions, %i[account_id bank_account_id due_date transaction_type_cd],
              name: :idx_transactions_filter
  end
end
