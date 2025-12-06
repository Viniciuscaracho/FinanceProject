class AddWhatsappFieldsToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :whatsapp_number, :string
    add_column :appointments, :stripe_payment_link_id, :string
    add_column :appointments, :payment_status, :integer
    add_column :appointments, :contact_id, :bigint
    add_column :appointments, :stripe_payment_intent_id, :string

    add_index :appointments, :contact_id
    add_index :appointments, :whatsapp_number
    add_index :appointments, :stripe_payment_link_id
    add_index :appointments, :payment_status
    add_foreign_key :appointments, :people, column: :contact_id
  end
end
