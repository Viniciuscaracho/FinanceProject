class CreateAppointmentNotes < ActiveRecord::Migration[7.0]
  def change
    create_table :appointment_notes do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :account, null: false, foreign_key: true
      t.text :notes
      t.jsonb :patient_tasks, default: [], null: false

      t.timestamps
    end

    add_index :appointment_notes, [:account_id, :appointment_id]
    add_index :appointment_notes, :patient_tasks, using: :gin
  end
end
