class AddAppointmentLinkIdToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :appointment_link_id, :bigint
    add_index :appointments, :appointment_link_id
    add_foreign_key :appointments, :appointment_links, column: :appointment_link_id, on_delete: :nullify
  end
end
