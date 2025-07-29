# frozen_string_literal: true

module Integrations
  # Service to upsert relationships based on the external entity and external id
  # Should be used by any integration service that is syncing data
  class UpsertRelationships < UpsertBase
    def call
      initialize_vars
      relationship = find_relationship
      if should_update_or_destroy?(relationship)
        update_or_destroy_relationship(relationship)
      elsif relationship.blank?
        create_relationship
      else
        # do nothing here, just return the relationship without changes
        context.relationship = relationship
      end
    end

    private

    def initialize_vars
      @external_id = context.external_id.to_s
      @internal_entity = context.internal_entity
      @internal_id = context.internal_id
      @last_update = parse_last_update
      @active = context.active
      super
    end

    def should_update_or_destroy?(relationship)
      # in case of internal entity and internal id, we should always update
      # otherwise we need to check if the last update is more recent than the current one
      relationship.present? && (relationship.source_last_update < @last_update || @internal_entity.present? || @internal_id.present?)
    end

    def update_or_destroy_relationship(relationship)
      # there is an update on the source data and it becomes inactive, we should destroy the relationship
      if relationship.source_last_update < @last_update && !@active.nil? && !@active
        return destroy_relationship(relationship)
      end

      update_relationship(relationship)
    end

  end
end
