class CreateSubscriptionInvoices < ActiveRecord::Migration[7.0]
  def change
    create_table :subscription_invoices do |t|
      t.references :account, null: false, foreign_key: true
      t.references :subscription, null: false, foreign_key: true
      t.string :processor_id, null: false, index: { unique: true }
      t.string :status, null: false
      t.jsonb :data, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :subscription_invoices, %i[account_id subscription_id processor_id], name: 'index_subscription_invoices_on_composed_index'
  end
end
