class AddTransactionTypeToDomains < ActiveRecord::Migration[7.0]
  def change
    add_column :domains, :transaction_type_cd, :integer
    add_index :domains, :transaction_type_cd
  end
end
