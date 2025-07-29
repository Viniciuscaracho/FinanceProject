# frozen_string_literal: true

class AddIndexWithAccountPaidDueDateToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_index :transactions, %i[account_id paid due_date], name: 'index_transactions_on_delayed_transactions_filter'
  end
end
