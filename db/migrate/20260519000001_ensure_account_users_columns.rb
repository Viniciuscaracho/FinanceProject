class EnsureAccountUsersColumns < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:account_users, :schedule)
      add_column :account_users, :schedule, :jsonb, default: {}
      add_index :account_users, :schedule, using: :gin
    end

    unless column_exists?(:account_users, :commission_percentage)
      add_column :account_users, :commission_percentage, :decimal, precision: 8, scale: 2, default: 50.0, null: false
    end
  end
end
