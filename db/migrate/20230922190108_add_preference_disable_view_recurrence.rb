# frozen_string_literal: true

class AddPreferenceDisableViewRecurrence < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :preference_disable_view_recurrence, :boolean, null: false, default: false
  end
end

