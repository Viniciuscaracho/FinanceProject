# frozen_string_literal: true

class AddGoogleCalendarToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :google_access_token,       :string
    add_column :accounts, :google_refresh_token,      :string
    add_column :accounts, :google_token_expires_at,   :datetime
    add_column :accounts, :google_calendar_id,        :string, default: 'primary'
    add_column :accounts, :google_calendar_connected, :boolean, default: false, null: false
  end
end
