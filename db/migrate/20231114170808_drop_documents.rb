class DropDocuments < ActiveRecord::Migration[7.0]
  def change
    drop_table :document_lines, if_exists: true
    drop_table :documents, if_exists: true
  end
end
