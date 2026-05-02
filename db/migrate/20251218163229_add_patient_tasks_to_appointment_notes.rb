class AddPatientTasksToAppointmentNotes < ActiveRecord::Migration[7.0]
  def change
    add_column :appointment_notes, :patient_tasks, :jsonb, default: [], null: false
    add_index :appointment_notes, :patient_tasks, using: :gin
  end
end

