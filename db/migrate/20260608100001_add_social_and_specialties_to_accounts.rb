# frozen_string_literal: true

class AddSocialAndSpecialtiesToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :instagram_url, :string
    add_column :accounts, :specialties, :string, array: true, default: []
  end
end
