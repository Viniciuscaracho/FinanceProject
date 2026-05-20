class AddPatientTasksToAppointmentNotes < ActiveRecord::Migration[7.0]
  def change
    # Guard: create_appointment_notes (20251218181222) has a higher timestamp but
    # creates the table; skip here if table doesn't exist yet (will be included in CREATE).
    return unless table_exists?(:appointment_notes) && !column_exists?(:appointment_notes, :patient_tasks)

    add_column :appointment_notes, :patient_tasks, :jsonb, default: [], null: false
    add_index :appointment_notes, :patient_tasks, using: :gin
  end
end

