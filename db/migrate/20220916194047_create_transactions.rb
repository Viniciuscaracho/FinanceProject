# frozen_string_literal: true

class CreateTransactions < ActiveRecord::Migration[7.0]
  def change
    create_table :transactions do |t|
      t.references :account, null: false, foreign_key: true
      t.references :bank_account, null: false, foreign_key: true
      t.references :contact, null: true, foreign_key: { to_table: :people }
      t.references :category, null: true, foreign_key: { to_table: :domains }
      t.references :cost_center, null: true, foreign_key: { to_table: :domains }
      t.references :transfer_to, null: true, foreign_key: { to_table: :bank_accounts }
      t.references :installment_source, null: true, foreign_key: { to_table: :transactions }

      # Enums
      t.integer :transaction_type_cd, null: false, default: 0, index: true
      t.integer :payment_method_cd, null: false, default: 0, index: true
      t.integer :payment_type_cd, null: false, default: 0, index: true
      t.integer :installment_type_cd, null: true, index: true

      # Flags
      t.boolean  :paid, null: false, default: false, index: true
      t.datetime :paid_at

      # Timestamps
      t.date :due_date, null: false, index: true
      t.date :competency_date

      t.string :document_number
      t.string :name
      t.text   :description

      t.integer :installment_number
      t.integer :installment_total

      t.bigint :amount_cents, null: false, default: 0
      t.string :amount_currency, limit: 3, null: false, default: 'BRL'

      t.bigint :exchanged_amount_cents, null: false, default: 0
      t.string :exchanged_amount_currency, limit: 3, null: false, default: 'BRL'

      t.timestamps
    end
  end
end
