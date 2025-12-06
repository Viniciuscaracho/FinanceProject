class CreatePayouts < ActiveRecord::Migration[7.0]
  def change
    create_table :payouts do |t|
      t.references :account, null: false, foreign_key: true
      t.references :account_user, null: false, foreign_key: true

      t.integer :total_amount_cents, null: false
      t.string :currency, default: "BRL"
      t.datetime :paid_at

      t.timestamps
    end
  end
end