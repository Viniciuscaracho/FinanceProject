# frozen_string_literal: true

class CreatePeople < ActiveRecord::Migration[7.0]
  def change
    create_table :people do |t|
      t.references :account, null: true, foreign_key: true
      t.string :type, null: false, index: true
      t.integer :person_type_cd, null: false, default: 0, index: true
      t.string :first_name, null: false
      t.string :last_name
      t.string :document_1
      t.string :document_2
      t.string :email
      t.string :phone_number
      t.date :birth_date
      t.text :description

      t.timestamps
      t.datetime :discarded_at, index: true
    end

    add_index :people, %i[account_id type discarded_at]
  end
end
