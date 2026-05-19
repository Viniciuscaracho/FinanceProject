# frozen_string_literal: true

class AddPixKeyToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :pix_key, :string
  end
end
