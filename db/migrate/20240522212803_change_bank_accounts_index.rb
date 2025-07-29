# frozen_string_literal: true

class ChangeBankAccountsIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    remove_index :bank_accounts, %i[discarded_at account_id],
                 order: { discarded_at: 'ASC NULLS FIRST' },
                 algorithm: :concurrently,
                 name: 'index_bank_accounts_on_multisearch_columns'

    add_index :bank_accounts, %i[account_id discarded_at],
              order: { discarded_at: 'ASC NULLS FIRST' },
              algorithm: :concurrently,
              name: 'index_bank_accounts_on_multisearch_columns'
  end
end
