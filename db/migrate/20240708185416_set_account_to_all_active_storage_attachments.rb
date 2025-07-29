class SetAccountToAllActiveStorageAttachments < ActiveRecord::Migration[7.0]
  def up
    SetAccountToAttachmentsJob.perform_later
  end

  def down
    ActiveStorage::Attachment.update_all(account_id: nil)
  end
end
