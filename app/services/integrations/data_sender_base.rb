# frozen_string_literal: true

module Integrations
  # Base class for data senders
  # Should be used by any integration service that is sending data and must create an outbound relationship
  # Also, the sender log should be updated with behavior of the client
  class DataSenderBase < ApplicationService
    def call
      initialize_vars
      find_or_create_relationship
      result = send_request
      if result.success?
        context.response = result.response
        context.body = JSON.parse(result.response.body, symbolize_names: true) if result.response.body.present?
        check_api_result(result)
      else
        context.relationship.update_sender_log(response: nil, status: :failed, error: result.error)
        context.relationship.reload
        context.fail!(error: result.error)
      end
    end

    protected

    def send_request
      context.fail!(error: 'Method send_request not implemented')
    end

    def integration_store
      context.fail!(error: 'Method integration_store not implemented')
    end

    private

    def initialize_vars
      @internal_entity = context.internal_entity.presence || context.fail!(error: 'Internal entity is required')
      @account_id = context.account_id.presence || context.fail!(error: 'Account id is required')
      @endpoint_key = context.endpoint_key.presence || context.fail!(error: 'Endpoint key is required')
      @sync_type = context.sync_type.presence || context.fail!(error: 'Sync type is required')
      @payload = context.payload
      context.fail!(error: 'Payload is required') if @payload.nil? && !delete_endpoint?
      @synced_by = context.synced_by
      @params = context.params || {}
    end

    def check_api_result(result)
      # if the response status code is between 200 and 299, we consider it a success
      status_code = result.response.code.to_i
      if (200..299).cover?(status_code)
        context.relationship.update_sender_log(response: context.body, status: :success, code: status_code)
        context.relationship.reload
      else
        error = "Request failed with status code: #{status_code}"
        context.relationship.update_sender_log(response: context.body, status: :failed, error:, code: status_code)
        context.relationship.reload
        Rails.logger.error(error)
        Rails.logger.error(context.body)
        context.fail!(error:)
      end
    end

    def find_or_create_relationship
      relationship = integration_store.relationship_stores.find_by(
        internal_entity:,
        internal_id: @internal_entity.id.to_s
      )
      if relationship.present? && (updatable_endpoint? || delete_endpoint?)
        relationship.add_sender_log(endpoint_key: @endpoint_key, params: @params, payload: @payload)
        context.relationship = relationship.reload
      elsif relationship.present?
        context.fail!(error: 'External entity is already set and endpoint is not updatable')
      else
        context.relationship = create_relationship
      end
    end

    def create_relationship
      relationship = integration_store.relationship_stores.create!({
                                                                     endpoint: integration_store.endpoint_url(@endpoint_key),
                                                                     account_id: @account_id,
                                                                     internal_entity:,
                                                                     internal_id: @internal_entity.id.to_s,
                                                                     sync_type_cd: @sync_type,
                                                                     synced_by_id: @synced_by&.id,
                                                                     direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                   })
      relationship.add_sender_log(endpoint_key: @endpoint_key, params: @params, payload: @payload)
      relationship.reload
    end

    def internal_entity
      # if @internal_entity.class has table_name method use it, otherwise use the class name
      # if the class name is ActiveStorage::Attached::One:Class, use attachment as the internal_entity
      if @internal_entity.class.respond_to?(:table_name)
        @internal_entity.class.table_name
      elsif @internal_entity.instance_of?(::ActiveStorage::Attached::One)
        'attachment'
      else
        @internal_entity.class.name
      end
    end

    def updatable_endpoint?
      endpoint = integration_store.endpoint(@endpoint_key)
      endpoint.present? && endpoint[:method].in?(%w[GET PUT PATCH])
    end

    def delete_endpoint?
      endpoint = integration_store.endpoint(@endpoint_key)
      endpoint.present? && endpoint[:method].in?(%w[DELETE])
    end
  end
end
