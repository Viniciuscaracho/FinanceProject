class AddCollapsedMenuToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :collapsed_menu, :boolean, default: false
  end
end
