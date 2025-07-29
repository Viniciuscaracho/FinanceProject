class AddPreferencesToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :preferences, :jsonb, default: {}, null: false
  end
end
