# frozen_string_literal: true

# Set the account to the existing attachments
class SetAccountToAttachmentsJob < ApplicationJob
  queue_as :scheduler

  def perform
    ApplicationRecord.transaction do
      ActiveStorage::Attachment.where(account_id: nil).find_each do |attachment|
        account = attachment.record if attachment.record.is_a?(Account)
        account = attachment.record&.account if attachment.record.respond_to?(:account)
        next unless account

        attachment.update_columns(account_id: account.id)
      end
    end
  end
end
