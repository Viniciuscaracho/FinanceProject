# frozen_string_literal: true

class CreateBanks < ActiveRecord::Migration[7.0]
  def change
    create_table :banks do |t|
      t.string :country, null: false
      t.integer :code, null: false
      t.string :name, null: false
      t.text :description
      t.string :ispb

      t.timestamps
    end

    add_index :banks, %i[country code], unique: true
  end
end
