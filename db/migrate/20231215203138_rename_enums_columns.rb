class RenameEnumsColumns < ActiveRecord::Migration[7.0]
  def change
    drop_table :company_economic_activities, if_exists: true

    remove_reference :offers, :economic_activity, foreign_key: { to_table: :enums }

    Enum.delete_all

    rename_column :enums, :code, :key
    rename_column :enums, :name, :value
    rename_column :enums, :data, :metadata
  end
end
