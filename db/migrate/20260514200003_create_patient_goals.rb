class CreatePatientGoals < ActiveRecord::Migration[7.0]
  def change
    create_table :patient_goals do |t|
      t.references :account, null: false, foreign_key: true
      t.bigint     :contact_id, null: false
      t.string     :title, null: false
      t.string     :unit
      t.decimal    :target_value, precision: 10, scale: 2
      t.decimal    :current_value, precision: 10, scale: 2
      t.date       :deadline
      t.text       :notes
      t.integer    :status, null: false, default: 0
      t.jsonb      :progress_history, null: false, default: []
      t.timestamps
    end

    add_index :patient_goals, :contact_id
    add_index :patient_goals, [:account_id, :contact_id]
    add_foreign_key :patient_goals, :people, column: :contact_id
  end
end
