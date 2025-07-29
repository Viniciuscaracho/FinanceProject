class AddPreferenceChangeDateToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :preference_change_date, :boolean, default: false
  end
end
