# frozen_string_literal: true

class CreateBankAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :bank_accounts do |t|
      t.references :account, null: false, foreign_key: true
      t.integer :account_type_cd, null: false, default: 0, index: true
      t.string :name, null: false
      t.boolean :default, null: false, default: false

      t.bigint :initial_balance_cents, null: false, default: 0
      t.string :initial_balance_currency, limit: 3, null: false, default: 'BRL'

      t.bigint :balance_cents, null: false, default: 0
      t.string :balance_currency, limit: 3, null: false, default: 'BRL'

      t.timestamps
    end
  end
end
