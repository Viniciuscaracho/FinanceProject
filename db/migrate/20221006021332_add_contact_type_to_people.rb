class AddContactTypeToPeople < ActiveRecord::Migration[7.0]
  def change
    add_column :people, :contact_type_cd, :integer, null: false, default: 0
    add_index :people, :contact_type_cd
  end
end
