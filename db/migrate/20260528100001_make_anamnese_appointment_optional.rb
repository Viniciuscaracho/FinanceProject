# frozen_string_literal: true

class MakeAnamneseAppointmentOptional < ActiveRecord::Migration[7.0]
  def change
    # Torna appointment_id opcional
    change_column_null :anamnese_responses, :appointment_id, true

    # Remove índice único que exigia appointment_id
    remove_index :anamnese_responses, name: 'index_anamnese_responses_on_account_id_and_appointment_id',
                 if_exists: true

    # Recria o índice unique apenas para linhas com appointment_id preenchido (partial index)
    add_index :anamnese_responses, [:account_id, :appointment_id],
              unique: true,
              where: 'appointment_id IS NOT NULL',
              name: 'idx_anamnese_responses_unique_appointment'
  end
end
