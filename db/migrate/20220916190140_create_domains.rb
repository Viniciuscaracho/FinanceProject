# frozen_string_literal: true

class CreateDomains < ActiveRecord::Migration[7.0]
  def change
    create_table :domains do |t|
      t.references :account, null: false, foreign_key: true
      t.string :type, null: false, index: true
      t.string :name, null: false
      t.text :description

      t.timestamps
      t.datetime :discarded_at, index: true
    end

    add_index :domains, %i[account_id type discarded_at]
  end
end
