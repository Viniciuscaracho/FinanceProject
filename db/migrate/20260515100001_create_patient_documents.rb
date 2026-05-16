# frozen_string_literal: true

class CreatePatientDocuments < ActiveRecord::Migration[7.0]
  def change
    create_table :patient_documents do |t|
      t.references :account, null: false, foreign_key: true
      t.references :contact, null: false, foreign_key: { to_table: :people }
      t.string :title, null: false
      t.text :content
      t.string :document_type
      t.string :public_token, null: false
      t.boolean :shared, default: false, null: false

      t.timestamps
    end

    add_index :patient_documents, :public_token, unique: true
    add_index :patient_documents, %i[account_id contact_id]
  end
end
