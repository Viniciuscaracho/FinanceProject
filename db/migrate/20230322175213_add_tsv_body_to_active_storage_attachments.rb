class AddTsvBodyToActiveStorageAttachments < ActiveRecord::Migration[7.0]
  def change
    add_column :active_storage_attachments, :tsv_body, :tsvector
    add_index :active_storage_attachments, :tsv_body, using: :gin
  end
end
