class AddUpdatedByToDomains < ActiveRecord::Migration[7.0]
  def change
    add_reference :domains, :created_by, null: true, foreign_key: { to_table: :users }
    add_reference :domains, :updated_by, null: true, foreign_key: { to_table: :users }
  end
end
