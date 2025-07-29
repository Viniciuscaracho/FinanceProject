# frozen_string_literal: true

module Integrations
  # Base class for upserts
  class UpsertBase < ApplicationService

    protected

    def initialize_vars
      @integration_store = context.integration_store
      @external_entity = context.external_entity
      @internal_entity = context.internal_entity
      @internal_id = context.internal_id
      @sync_type = context.sync_type
      @synced_by = context.synced_by
      @synced_at = context.synced_at
      @endpoint = context.endpoint
      @response = context.response
      @extras = context.extras
      @tied_to = context.tied_to
    end

    def parse_last_update(last_update = nil)
      date = last_update || context.last_update
      return nil if date.blank?

      Chronic.parse(date)
    end

    def find_relationship
      @integration_store.relationship_stores.find_by(external_entity: @external_entity, external_id: @external_id)
    end

    def destroy_relationship(relationship)
      relationship.destroy!
      context.destroyed = true
      context.relationship = nil
    end

    def update_relationship(relationship)
      relationship.raw_data = @response
      relationship.source_last_update = @last_update if @last_update.present?
      relationship.sync_type_cd = @sync_type if @sync_type.present?
      relationship.synced_by_id = @synced_by&.id if @synced_by.present?
      relationship.internal_entity = @internal_entity if @internal_entity.present?
      relationship.internal_id = @internal_id if @internal_id.present?
      relationship.extras = @extras if @extras.present?
      relationship.save!
      relationship.reload
      context.relationship = relationship
    end

    def create_relationship
      relationship = @integration_store.relationship_stores.create!({
                                                                      endpoint: @integration_store.endpoint_url(@endpoint),
                                                                      account_id: @integration_store.account_id,
                                                                      external_entity: @external_entity.to_s,
                                                                      external_id: @external_id.to_s,
                                                                      internal_entity: @internal_entity.to_s,
                                                                      internal_id: @internal_id,
                                                                      sync_type_cd: @sync_type,
                                                                      synced_at: @synced_at,
                                                                      synced_by_id: @synced_by&.id,
                                                                      source_last_update: @last_update,
                                                                      raw_data: @response,
                                                                      extras: @extras,
                                                                      tied_to: @tied_to
                                                                    })
      context.relationship = relationship
    end
  end
end
