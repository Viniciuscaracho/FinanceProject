# frozen_string_literal: true

class CreateExchangeRates < ActiveRecord::Migration[7.0]
  def change
    create_table :exchange_rates do |t|
      t.string :from, null: false, limit: 3
      t.string :to, null: false, limit: 3
      t.decimal :rate, null: false, precision: 20, scale: 5

      t.timestamps
    end

    add_index :exchange_rates, %i[from to]
  end
end
