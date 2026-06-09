class AddProfileViewsToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :profile_views, :integer, default: 0, null: false
  end
end
