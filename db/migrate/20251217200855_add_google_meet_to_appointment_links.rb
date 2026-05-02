class AddGoogleMeetToAppointmentLinks < ActiveRecord::Migration[7.0]
  def change
    add_column :appointment_links, :enable_google_meet, :boolean, default: false
  end
end
