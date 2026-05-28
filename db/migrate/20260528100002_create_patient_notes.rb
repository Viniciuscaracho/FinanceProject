# frozen_string_literal: true

class CreatePatientNotes < ActiveRecord::Migration[7.0]
  def change
    create_table :patient_notes do |t|
      t.references :account,  null: false, foreign_key: true
      t.references :contact,  null: false, foreign_key: { to_table: :people }
      t.text       :content
      t.timestamps
    end

    add_index :patient_notes, [:account_id, :contact_id]
  end
end
