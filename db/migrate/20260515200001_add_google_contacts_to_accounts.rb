# frozen_string_literal: true

class AddGoogleContactsToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :google_contacts_access_token,     :string
    add_column :accounts, :google_contacts_refresh_token,    :string
    add_column :accounts, :google_contacts_token_expires_at, :datetime
    add_column :accounts, :google_contacts_connected,        :boolean, default: false, null: false
  end
end
