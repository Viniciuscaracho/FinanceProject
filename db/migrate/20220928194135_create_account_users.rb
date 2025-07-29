# frozen_string_literal: true

class CreateAccountUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :account_users do |t|
      t.references :account, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role_cd, null: false, default: 0, index: true

      t.timestamps
    end
  end
end
