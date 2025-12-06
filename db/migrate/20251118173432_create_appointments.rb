class CreateAppointments < ActiveRecord::Migration[7.0]
  def change
    create_table :appointments do |t|
      t.references :account, null: false, foreign_key: true
      t.references :account_user, null: false, foreign_key: true
      t.references :service, null: false, foreign_key: true

      t.datetime :start_time
      t.datetime :end_time

      t.integer :price_cents, null: false
      t.string :price_currency, default: "BRL"

      t.integer :status, default: 0 # booked, completed, canceled

      t.timestamps
    end
  end
end