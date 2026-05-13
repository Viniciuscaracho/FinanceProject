class AddManageTokenToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :manage_token, :string
    add_index :appointments, :manage_token, unique: true
  end
end
