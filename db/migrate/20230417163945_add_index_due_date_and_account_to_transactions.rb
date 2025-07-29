class AddIndexDueDateAndAccountToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_index :transactions, %i[account_id due_date], name: 'index_transactions_on_account_and_due_date'
  end
end
