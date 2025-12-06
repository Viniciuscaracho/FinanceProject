class AddScheduleToAccountUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :account_users, :schedule, :jsonb, default: {}
    add_index :account_users, :schedule, using: :gin
  end
end
