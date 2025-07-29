class AddUpdatedByToTransactions < ActiveRecord::Migration[7.0]
  def change
    add_reference :transactions, :created_by, null: true, foreign_key: { to_table: :users }
    add_reference :transactions, :updated_by, null: true, foreign_key: { to_table: :users }
  end
end
