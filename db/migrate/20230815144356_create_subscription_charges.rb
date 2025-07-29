class CreateSubscriptionCharges < ActiveRecord::Migration[7.0]
  def change
    create_table :subscription_charges do |t|
      t.references :account, null: false, foreign_key: true
      t.references :subscription, null: false, foreign_key: true
      t.references :subscription_invoice, null: false, foreign_key: true
      t.string :processor_id, null: false, index: { unique: true }
      t.string :status, null: false, index: true
      t.bigint :amount_cents, null: false, default: 0
      t.bigint :amount_captured_cents, null: false, default: 0
      t.bigint :amount_refunded_cents, null: false, default: 0
      t.bigint :application_fee_amount_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL', limit: 3
      t.jsonb :metadata, null: false, default: {}
      t.jsonb :data, null: false, default: {}
      t.jsonb :invoice, null: false, default: {}

      t.timestamps
    end

    add_index :subscription_charges, %i[account_id subscription_id subscription_invoice_id processor_id], name: 'index_subscription_charges_on_composed_index'
  end
end
