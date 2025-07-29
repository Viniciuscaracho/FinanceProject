# frozen_string_literal: true

module CompanyNfseConfigs
  class SyncRpsNumberingSubscriber < ApplicationSubscriber
    on_publish :relationship_store_updated

    def on_relationship_store_updated(event)
      relationship = event.payload.fetch(:record)
      return unless relationship.sender_synced? && relationship.external_entity == 'nfse'

      relationship.account.company.nfse_config.sync_rps_numbering
    end

    # private

  end
end
