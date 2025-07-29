class AddMaxAttrsToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :max_storage_size_in_bytes, :bigint, null: false, default: 5.gigabytes
    add_column :accounts, :max_active_users, :integer, null: false, default: 3
  end
end
