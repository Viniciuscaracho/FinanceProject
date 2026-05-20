class SetAccountToAllActiveStorageAttachments < ActiveRecord::Migration[7.0]
  def up
    SetAccountToAttachmentsJob.perform_later
  rescue => e
    Rails.logger.warn "SetAccountToAllActiveStorageAttachments migration: skipping async job (#{e.class}: #{e.message})"
  end

  def down
    ActiveStorage::Attachment.update_all(account_id: nil)
  end
end
