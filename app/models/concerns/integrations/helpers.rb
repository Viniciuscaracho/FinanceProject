# frozen_string_literal: true

module Integrations
  # Helper module for integrations
  # This module will be included in every integration store to facilitate the access to the settings
  module Helpers
    extend ActiveSupport::Concern

    # rubocop:disable Metrics/BlockLength
    included do
      def upsert_config(config)
        value = settings(:config).value
        save_config = {}
        if value.blank?
          save_config[Rails.env] = config
        elsif value[Rails.env].blank?
          save_config = { **value }
          save_config[Rails.env] = config
        else
          save_config = { **value }
          save_config[Rails.env] = {
            **save_config[Rails.env],
            **config
          }
        end
        settings(:config).update!(save_config)
      end

      def upsert_endpoint(name, endpoint)
        endpoints = settings(:endpoints).value
        endpoint = validate_endpoint(endpoint)
        if endpoints.blank?
          save_endpoints = { "#{name}": endpoint }
        elsif endpoints[name.to_s].present?
          save_endpoints = endpoints
          save_endpoints[name.to_s] = endpoint
        else
          save_endpoints = {
            **endpoints,
            "#{name}": endpoint
          }
        end
        settings(:endpoints).update!(save_endpoints)
      end

      def config
        value = settings(:config).value[Rails.env]
        JSON.parse(value.to_json, symbolize_names: true)
      end

      def endpoints
        if parent_store.present?
          parent_store.endpoints
        else
          value = settings(:endpoints).value
          JSON.parse(value.to_json, symbolize_names: true)
        end
      end

      def endpoint(name)
        if parent_store.present?
          parent_store.endpoint(name)
        else
          endpoints[name.to_sym]
        end
      end

      # default endpoint url (with params masked as {{param}})
      def endpoint_url(endpoint)
        if endpoint == :webhooks
          endpoint.to_s
        elsif parent_store.present?
          parent_store.endpoint_url(endpoint)
        else
          "#{config[:host]}#{self.endpoint(endpoint)[:uri]}"
        end
      end

      # Already replaced the params in the uri
      def endpoint_uri(uri)
        if parent_store.present?
          parent_store.endpoint_uri(uri)
        else
          "#{config[:host]}#{uri}"
        end
      end

      private

      def validate_endpoint(endpoint)
        unless endpoint.is_a?(Hash) && (endpoint.keys - %i[
          method uri
        ]).empty?
          raise ArgumentError,
                'Endpoint must be a hash with method and uri keys'
        end

        unless Net::HTTP.const_defined?(endpoint[:method].to_s.titleize)
          raise ArgumentError,
                'Endpoint method must be a valid HTTP method'
        end

        endpoint
      end
    end
    # rubocop:enable Metrics/BlockLength
  end
end
