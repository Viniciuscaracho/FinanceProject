# frozen_string_literal: true

class ReindexTsvBody < ActiveRecord::Migration[7.0]
  def up
    Rails.logger.info('Starting reindex')
    ActiveRecord::Base.transaction do
      # CostCenter.reindex_all
      # Category.reindex_all
      # Contact.reindex_all
      # ActiveStorage::Attachment.reindex_all
      # Transaction.reindex_all
    end
    Rails.logger.info('Reindex finished!')
  end
end
