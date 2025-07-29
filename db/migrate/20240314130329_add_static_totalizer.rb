# frozen_string_literal: true

class AddStaticTotalizer < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :preference_static_totalizer, :boolean, default: false
  end
end
