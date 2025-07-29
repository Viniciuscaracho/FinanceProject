# frozen_string_literal: true

class CreateInvoices < ActiveRecord::Migration[7.0]
  def change
    create_table :invoices do |t|
      t.references :account, null: false, foreign_key: true
      t.references :bank_account, null: false, foreign_key: true
      t.references :provider, null: false, foreign_key: { to_table: :people }
      t.references :recipient, null: false, foreign_key: { to_table: :people }
      t.references :record, null: true, polymorphic: true
      t.string :status, null: false, default: 'draft'
      t.integer :number
      t.date :issue_date
      t.date :due_date
      t.string :name
      t.text :description
      t.bigint :amount_cents, null: false, default: 0
      t.bigint :subtotal_cents, null: false, default: 0
      t.string :discount_description
      t.decimal :discount_percentage, precision: 10, scale: 2, null: false, default: 0
      t.bigint :discount_cents, null: false, default: 0
      t.string :tax_description
      t.decimal :tax_percentage, precision: 10, scale: 2, null: false, default: 0
      t.bigint :tax_cents, null: false, default: 0
      t.boolean :tax_already_applied, null: false, default: true
      t.bigint :total_before_tax_cents, null: false, default: 0
      t.bigint :total_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.boolean :sync_with_transaction, null: false, default: true
      t.datetime :drafted_at
      t.datetime :opened_at
      t.datetime :paid_at
      t.datetime :canceled_at
      t.datetime :sent_at
      t.tsvector :tsv_body

      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :invoices, :tsv_body, using: :gin
    add_index :invoices, %i[account_id number]
    add_index :invoices, %i[account_id status]
    add_index :invoices, %i[account_id issue_date]
    add_index :invoices, %i[account_id due_date]
  end
end
