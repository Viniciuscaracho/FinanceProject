class AddIndexToPeople < ActiveRecord::Migration[7.0]
  def change
    add_index :people, %i[id type]
    add_index :people, %i[account_id contact_type_cd]
  end
end
