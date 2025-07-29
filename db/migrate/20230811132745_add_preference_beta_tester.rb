# frozen_string_literal: true

class AddPreferenceBetaTester < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :preference_beta_tester, :boolean, null: false, default: false
  end
end
