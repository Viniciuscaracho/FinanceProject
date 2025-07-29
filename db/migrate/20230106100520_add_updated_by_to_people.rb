class AddUpdatedByToPeople < ActiveRecord::Migration[7.0]
  def change
    add_reference :people, :created_by, null: true, foreign_key: { to_table: :users }
    add_reference :people, :updated_by, null: true, foreign_key: { to_table: :users }
  end
end
