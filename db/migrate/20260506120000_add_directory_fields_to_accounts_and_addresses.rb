# frozen_string_literal: true

class AddDirectoryFieldsToAccountsAndAddresses < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :directory_visible,     :boolean, default: false, null: false
    add_column :accounts, :profession_category,   :string
    add_column :accounts, :directory_description, :text

    add_column :addresses, :latitude,  :decimal, precision: 10, scale: 7
    add_column :addresses, :longitude, :decimal, precision: 10, scale: 7

    add_index :accounts, :directory_visible
    add_index :accounts, :profession_category
  end
end
