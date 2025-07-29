class AddUniqueIndexToAccountUsers < ActiveRecord::Migration[7.0]
  def change
    add_index :account_users, %i[account_id user_id], unique: true
  end
end
