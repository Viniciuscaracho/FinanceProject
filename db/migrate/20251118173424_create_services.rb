class CreateServices < ActiveRecord::Migration[7.0]
  def change
    create_table :services do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :price_cents, null: false
      t.string :price_currency, default: "BRL", null: false
      t.integer :default_commission_type, default: 0 # percent or fixed
      t.decimal :default_commission_value, precision: 8, scale: 2

      t.timestamps
    end
  end
end