class AddDefaultToDocumentTemplate < ActiveRecord::Migration[7.0]
  def change
    add_column :document_templates, :default, :boolean, default: false
  end
end
