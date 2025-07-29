# frozen_string_literal: true

class CreateAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :accounts do |t|
      t.string :default_currency, default: 'BRL', limit: 3
      t.string :country_code, default: 'BR', limit: 2

      t.timestamps
      t.datetime :discarded_at, index: true
    end
  end
end
