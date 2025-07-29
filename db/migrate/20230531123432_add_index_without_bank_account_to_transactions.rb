# frozen_string_literal: true

class AddIndexWithoutBankAccountToTransactions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :transactions,
              %i[kind_cd transaction_type_cd account_id due_date],
              name: 'index_transactions_on_search',
              algorithm: :concurrently
  end
end
