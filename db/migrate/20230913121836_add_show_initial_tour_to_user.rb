class AddShowInitialTourToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :show_initial_tour, :boolean
  end
end
