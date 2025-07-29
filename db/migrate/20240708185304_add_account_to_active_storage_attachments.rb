class AddAccountToActiveStorageAttachments < ActiveRecord::Migration[7.0]
  def change
    add_reference :active_storage_attachments, :account, foreign_key: true
  end
end
