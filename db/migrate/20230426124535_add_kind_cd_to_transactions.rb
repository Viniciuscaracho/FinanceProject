# frozen_string_literal: true

class AddKindCdToTransactions < ActiveRecord::Migration[7.0]
  def change
    change_table :transactions, bulk: true do |t|
      t.references :parent, null: true, foreign_key: { to_table: :transactions }
      t.integer :kind_cd, null: false, default: 0
    end

    remove_index :transactions, %i[account_id bank_account_id due_date transaction_type_cd], name: 'idx_transactions_filter'
    add_index :transactions, %i[account_id kind_cd transaction_type_cd due_date bank_account_id], name: 'index_transactions_on_search_filter'
    add_index :transactions, %i[account_id kind_cd], name: 'index_transactions_on_kind_cd'
  end
end
