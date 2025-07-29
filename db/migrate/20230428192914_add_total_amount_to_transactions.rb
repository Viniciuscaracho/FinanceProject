class AddTotalAmountToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_column :transactions, :paid_amount_cents, :bigint, null: false, default: 0
    add_column :transactions, :paid_amount_currency, :string, null: false, default: 'BRL', limit: 3
  end
end
