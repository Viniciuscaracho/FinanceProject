class AddPreferenceReceiveEmailToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :preference_receive_email, :boolean, default: true
  end
end
