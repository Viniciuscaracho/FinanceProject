class ChangeAccountIdFromUsers < ActiveRecord::Migration[7.0]
  def up
    change_column_null :users, :account_id, true
  end

  def down
    change_column_null :users, :account_id, false
  end
end
