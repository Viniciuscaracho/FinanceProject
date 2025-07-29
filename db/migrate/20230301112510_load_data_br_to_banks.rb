# frozen_string_literal: true

class LoadDataBrToBanks < ActiveRecord::Migration[7.0]
  def up
    ActiveRecord::Base.transaction do
      Bank.load_banks!
    end
  end
end
