class AddPoliciesToAccountUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :account_users, :policies, :jsonb, null: false, default: []
  end
end
