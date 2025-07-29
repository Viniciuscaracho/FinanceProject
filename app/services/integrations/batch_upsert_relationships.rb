# frozen_string_literal: true

module Integrations
  # Bath upsert relationships base on the external entity and external id for a given payload/response array
  class BatchUpsertRelationships < UpsertBase
    def call
      initialize_vars
      batch_upsert
    end

    private

    def initialize_vars
      super
      context.fail!(error: 'Response must be an array for batch operation') unless @response.is_a?(Array)
      context.fail!(error: 'Response array must not be empty') if @response.empty?

      @external_id_accessor = context.external_id.to_s
      @last_update_accessor = context.last_update
      @active_accessor = context.active
      @active_check = context.active_check
    end

    def batch_upsert
      @response.each do |response|
        data = response.to_h.with_indifferent_access
        @external_id = find_value_by_accessor(@external_id_accessor, data)
        @last_update = find_value_by_accessor(@last_update_accessor, data)
        @active = @active_check? find_value_by_accessor(@active_accessor, data) == @active_check : true
        upsert_relationship(response)
      end
    end

    def upsert_relationship(response)
      result = Integrations::UpsertRelationships.call(
        integration_store: @integration_store,
        external_entity: @external_entity,
        external_id: @external_id,
        internal_entity: @internal_entity,
        internal_id: @internal_id,
        last_update: @last_update,
        sync_type: @sync_type,
        synced_by: @synced_by,
        synced_at: @synced_at,
        endpoint: @endpoint,
        tied_to: @tied_to,
        active: @active,
        extras: @extras,
        response:
      )
      process_result(result, response)
    end

    def init_context_vars
      context.failed_data ||= []
      context.processed_data ||= []
      context.relationships ||= []
    end

    def process_result(result, response)
      init_context_vars
      if result.failure?
        context.failed_data << {
          data: response,
          error: result.error
        }
      else
        context.processed_data << response
        context.relationships << result.relationship
      end
    end

    def find_value_by_accessor(accessor, data)
      return nil if accessor.blank?
      return context.fail!(error: 'Accessor must be a symbol or a string') unless accessor.is_a?(Symbol) || accessor.is_a?(String)

      JsonPath.on(data.to_json, "$..#{accessor}").first
    end
  end
end
