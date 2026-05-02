class AddSessionsToDocumentTemplates < ActiveRecord::Migration[7.0]
  def change
    add_column :document_templates, :enable_sessions, :boolean, default: false, null: false
    add_column :document_templates, :session_count, :integer
    add_column :document_templates, :session_number, :integer
    add_column :document_templates, :session_type, :string
    add_column :document_templates, :professional_type, :string, comment: "Tipo de profissional (psicólogo, professor, nutricionista, etc.)"
  end
end

