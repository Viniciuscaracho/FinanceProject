# frozen_string_literal: true

# Integration module will be the main concern module for everything related to the integration store
module Integrations
  # Adds outbound features to outbound relationships
  module OutboundFeatures
    extend ActiveSupport::Concern

    included do
      attr_accessor :endpoint_key, :params, :payload

      before_create :initialize_sender_extras, if: :outbound_relationship?

      def initialize_sender_extras
        self.extras = {
          data_sender_log: []
        }
      end

      def add_sender_log(endpoint_key:, params:, payload:)
        initialize_sender(endpoint_key:, params:, payload:)
        log = extras['data_sender_log']
        log << data_sender_log(log.size + 1)
        extras['data_sender_log'] = log
        update!(extras:)
      end

      def update_sender_log(response:, status: :success, error: nil, code: nil)
        logs = extras['data_sender_log']
        update_sender_status_logs(logs, response, status, error, code)
        extras['data_sender_log'] = logs
        update!(extras:)
      end

      def sender_logs
        if direction_cd == RelationshipStore::DIRECTION_TYPES[:inbound] || extras.blank? || extras.with_indifferent_access[:data_sender_log].blank?
          []
        else
          extras.with_indifferent_access[:data_sender_log]
        end
      end

      def last_sync_log
        sender_logs.max_by { |log| log[:id] }&.with_indifferent_access
      end

      def sender_synced?
        last_sync = last_sync_log
        last_sync.present? && last_sync[:status].to_s == 'success'
      end

      def sender_failed?
        last_sync = last_sync_log
        last_sync.present? && last_sync[:status].to_s == 'failed'
      end

      def sender_processing?
        last_sync = last_sync_log
        last_sync.present? && last_sync[:status].to_s == 'processing'
      end

      def sender_pending?
        last_sync = last_sync_log
        last_sync.present? && last_sync[:status].to_s == 'pending'
      end

      def synced!
        self.synced_at = Time.zone.now
        save!
        reload
      end

      private

      def initialize_sender(endpoint_key:, params:, payload:)
        self.endpoint_key = endpoint_key
        self.params = params
        self.payload = payload
      end

      def data_sender_log(id)
        {
          id:,
          endpoint_key:,
          params:,
          payload:
        }
      end

      def update_sender_status_logs(logs, response, status, error = nil, code = nil)
        logs ||= []
        id = logs.size
        log = logs.find { |l| l['id'] == id } || {}
        idx = logs.index(log) || 0
        log[:response] = response unless log.present? && log[:response].present? && response.nil?
        log[:status] = status
        log[:error] = error
        log[:code] = code
        logs[idx] = log
        logs
      end
    end
  end
end
