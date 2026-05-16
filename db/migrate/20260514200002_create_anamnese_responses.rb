class CreateAnamneseResponses < ActiveRecord::Migration[7.0]
  def change
    create_table :anamnese_responses do |t|
      t.references :account,           null: false, foreign_key: true
      t.references :appointment,       null: false, foreign_key: true
      t.bigint     :contact_id
      t.references :anamnese_template, null: true,  foreign_key: true
      t.jsonb      :responses,         null: false, default: {}
      t.datetime   :filled_at
      t.timestamps
    end

    add_index :anamnese_responses, :contact_id
    add_index :anamnese_responses, [:account_id, :appointment_id], unique: true
    add_foreign_key :anamnese_responses, :people, column: :contact_id
  end
end
