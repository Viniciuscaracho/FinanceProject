class CreatePaymentPlans < ActiveRecord::Migration[7.0]
  def change
    create_table :payment_plans do |t|
      t.references :account, null: false, foreign_key: true
      t.bigint :amount_cents, null: false, default: 0
      t.string :amount_currency, null: false, default: 'BRL', limit: 3
      t.integer :amount_type_cd, null: false, default: 0, index: true # :total
      t.integer :frequency_cd, null: false, default: 3, index: true   # :monthly
      t.integer :number_of_installments, null: false, default: 3      # 3 installments

      t.timestamps
      t.datetime :discarded_at, index: true
    end

    add_reference :transactions, :payment_plan, null: true, foreign_key: true
  end
end
