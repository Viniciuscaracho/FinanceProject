# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Abstract class to represent a Nuvem Fiscal DTO with common methods
    # to be used in the endpoint services
    class Dto < ApplicationService

      def call
        initialize_vars
        result = send_request
        if result.success?
          context.relationship = update_relationship(result)
        else
          context.relationship = result.relationship
          context.fail!(error: result.error)
        end
      end

      protected

      def initialize_vars
        @company = context.company.presence || context.fail!(error: 'Company is required')
        @sync_type = context.sync_type.presence || RelationshipStore::SYNC_TYPES[:auto_sync]
        @synced_by = context.synced_by
      end

      def params
        @params ||= {}
      end

      def payload
        @payload ||= nil
      end

      def dto
        @dto ||= nil
      end

      def send_request
        context.fail!(error: payload.errors.full_messages) if payload.present? && !payload.valid?

        Integrations::NuvemFiscal::DataSender.call(
          endpoint_key:,
          internal_entity:,
          account_id: @company.account.id,
          payload: payload&.to_h,
          sync_type: @sync_type,
          synced_by: @synced_by,
          params:
        )
      end

      def internal_entity
        raise 'Method internal_entity not implemented'
      end

      def endpoint_key
        raise 'Method endpoint_key not implemented'
      end

      def update_relationship(_result)
        raise 'Method update_relationship not implemented'
      end
    end
  end
end
