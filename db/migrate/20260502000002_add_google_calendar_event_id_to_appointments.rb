# frozen_string_literal: true

class AddGoogleCalendarEventIdToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :google_calendar_event_id, :string
    add_index  :appointments, :google_calendar_event_id
  end
end
