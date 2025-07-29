# frozen_string_literal: true

Rails.configuration.to_prepare do
  ActiveStorage::Attachment.include Attachments::Searchable
  ActiveStorage::Attachment.include Attachments::Accountable
end
