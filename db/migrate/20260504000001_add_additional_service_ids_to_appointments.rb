class AddAdditionalServiceIdsToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :additional_service_ids, :jsonb, default: [], null: false
  end
end
