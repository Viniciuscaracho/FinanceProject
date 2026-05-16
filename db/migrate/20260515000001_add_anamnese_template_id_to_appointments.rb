# frozen_string_literal: true

class AddAnamneseTemplateIdToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_reference :appointments, :anamnese_template, null: true, foreign_key: true
  end
end
