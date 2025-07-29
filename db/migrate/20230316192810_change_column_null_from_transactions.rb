class ChangeColumnNullFromTransactions < ActiveRecord::Migration[7.0]
  def change
    change_column_null :transactions, :bank_account_id, true
  end
end
