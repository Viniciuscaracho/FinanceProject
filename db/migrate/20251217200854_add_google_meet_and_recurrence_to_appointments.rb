class AddGoogleMeetAndRecurrenceToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :google_meet_link, :string
    add_column :appointments, :recurrence_pattern, :jsonb, default: {}
    add_column :appointments, :parent_appointment_id, :bigint
    add_column :appointments, :whatsapp_reminder_sent, :boolean, default: false
    add_column :appointments, :whatsapp_reminder_sent_at, :datetime
    
    add_index :appointments, :parent_appointment_id
    add_foreign_key :appointments, :appointments, column: :parent_appointment_id, on_delete: :nullify
  end
end
