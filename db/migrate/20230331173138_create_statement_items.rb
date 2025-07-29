class CreateStatementItems < ActiveRecord::Migration[7.0]
  def change
    create_table :statement_items do |t|
      t.references :statement, null: false, foreign_key: true
      t.references :contact, null: true, foreign_key: { to_table: :people }
      t.references :category, null: true, foreign_key: { to_table: :domains }
      t.references :bank_account_source, null: true, foreign_key: { to_table: :bank_accounts }
      t.references :bank_account_target, null: true, foreign_key: { to_table: :bank_accounts }
      t.references :related_transaction, null: true, foreign_key: { to_table: :transactions }
      t.integer :status_cd, null: false, index: true, default: 0
      t.integer :transaction_type_cd, null: true, index: true
      t.integer :type_cd, null: false, index: true
      t.date :posted_at, null: false
      t.string :memo, null: false
      t.bigint :amount_cents, null: false, default: 0
      t.string :amount_currency, null: false, default: 'BRL', limit: 3

      t.date :due_date, null: false
      t.string :name, null: false
      t.string :document_number, null: false
      t.datetime :confirmed_at
      t.datetime :ignored_at
      t.datetime :reconciled_at

      t.timestamps
      t.datetime :discarded_at, index: true
    end
  end
end
