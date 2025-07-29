class CreateInvoiceLines < ActiveRecord::Migration[7.0]
  def change
    create_table :invoice_lines do |t|
      t.references :invoice, null: false, foreign_key: true
      t.references :record, null: true, polymorphic: true
      t.references :offer, null: true, foreign_key: true
      t.integer :sequential_id
      t.text :description
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 0
      t.string :unit, null: true
      t.bigint :unit_price_cents, null: false, default: 0
      t.bigint :total_price_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end
  end
end
