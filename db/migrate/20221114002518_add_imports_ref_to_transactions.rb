class AddImportsRefToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_reference :transactions, :import, foreign_key: true
  end
end
