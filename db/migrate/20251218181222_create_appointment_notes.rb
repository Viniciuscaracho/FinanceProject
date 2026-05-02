class CreateAppointmentNotes < ActiveRecord::Migration[7.0]
  def change
    create_table :appointment_notes do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :account, null: false, foreign_key: true
      t.text :notes

      t.timestamps
    end

    add_index :appointment_notes, [:account_id, :appointment_id]
  end
end
