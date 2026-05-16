class CreatePixBillings < ActiveRecord::Migration[7.0]
  def change
    create_table :pix_billings do |t|
      t.references :account, null: false, foreign_key: true
      t.string :billing_id, null: false
      t.string :billing_url
      t.integer :amount, null: false
      t.string :status, null: false, default: 'PENDING'
      t.string :frequency, null: false, default: 'MONTHLY'
      t.string :plan_id
      t.string :plan_name
      t.datetime :paid_at
      t.datetime :expires_at
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :pix_billings, :billing_id, unique: true
    add_index :pix_billings, [:account_id, :status]
  end
end
