class CreateProfessionalCommissions < ActiveRecord::Migration[7.0]
  def change
    create_table :professional_commissions do |t|
      t.references :account_user, null: false, foreign_key: true
      t.references :service, null: false, foreign_key: true

      t.integer :commission_type, default: 0 # percent or fixed
      t.decimal :commission_value, precision: 8, scale: 2, null: false

      t.timestamps
    end
  end
end