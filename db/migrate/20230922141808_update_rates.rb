# frozen_string_literal: true

class UpdateRates < ActiveRecord::Migration[7.0]
  def change
    Money.default_bank.update_rates
  end
end
