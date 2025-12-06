class CreateAppointmentCommissions < ActiveRecord::Migration[7.0]
  def change
    create_table :appointment_commissions do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :account_user, null: false, foreign_key: true

      t.integer :commission_type, null: false
      t.decimal :commission_value, precision: 8, scale: 2, null: false
      t.integer :commission_amount_cents, null: false

      t.timestamps
    end
  end
end