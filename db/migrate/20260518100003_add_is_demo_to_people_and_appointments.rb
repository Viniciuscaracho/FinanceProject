# frozen_string_literal: true

class AddIsDemoToPeopleAndAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :people, :is_demo, :boolean, default: false, null: false
    add_column :appointments, :is_demo, :boolean, default: false, null: false
  end
end
