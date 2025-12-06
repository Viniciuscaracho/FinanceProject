# frozen_string_literal: true

module Integrations
  # This is the Pluggy client that will be used to communicate with Pluggy API
  # You can see that we have some hardcoded rules to deal with the endpoints that make things easier
  # At some point, if you need to add more ruling, consider to add a service for that
  class PluggyClient < ApplicationService
    def call
      initialize_vars
      result = send_request
      if result.is_a?(String)
        context.response = { api_key: result }
      elsif result.success?
        context.response = result.response
        context.body = JSON.parse(result.response.body, symbolize_names: true)
        paginate_response
      else
        context.fail!(error: result.error)
      end
    end

    private

    AUTH_ENDPOINTS = %i[token connect_token].freeze

    def initialize_vars
      @endpoint_key = context.endpoint_key.presence || context.fail!(error: 'Endpoint key is required')
      @integration_store = integration_store(context.account_id)
      @params = context.params || {}
      @payload = context.payload || {}
      @headers = (context.headers || {}).merge(default_headers)
    end

    def paginate_response
      return unless more?

      context[:has_more?] = true
      context.next = lambda {
        query_params = @params[:query] || { page: 1 }
        query_params[:page] = context.body[:page] + 1
        PluggyClient.call(
          account_id: context.account_id,
          endpoint_key: @endpoint_key,
          params: @params.merge({ query: query_params }),
          payload: @payload,
          headers: @headers
        )
      }
    end

    def more?
      query_params = @params[:query] || { page: 1 }
      page = query_params[:page] || 1
      total_pages = context.body[:totalPages] || 1
      page < total_pages
    end

    def send_request
      context[:has_more?] = false
      return refresh_api_key if @endpoint_key == :token

      Integrations::HttpClient.call(
        integration_store: @integration_store,
        endpoint_key: @endpoint_key,
        payload: @payload.merge(fetch_payload),
        headers: @headers,
        params: @params.merge(account_params)
      )
    end

    def fetch_payload
      if @endpoint_key == :connect_token
        IntegrationStores::Pluggy.pluggy_connect_token_payload(account_id: context.account_id)
      else
        {}
      end
    end

    def account_params
      # item_id represents the bank connection between barber management account and pluggy
      # this should be store at account_store level
      case @endpoint_key
      when :accounts, :item
        @params[:uri].blank? || @params[:uri][:item_id].blank? ? item_param : {}
      else
        {}
      end
    end

    def item_param
      item_id = @integration_store.config[:item_id]
      context.fail!(error: "Pluggy Item id not found for account: #{context.account_id}") if item_id.blank?

      { uri: { item_id: } }
    end

    def validate_account_id(account_id)
      # Endpoints that require an account id to deal with account stores (these are user specific data endpoints)
      require_account = %i[accounts account transactions transaction connect_token item].freeze
      context.fail!(error: 'Account id is required') if account_id.nil? && require_account.include?(@endpoint_key)
      account_id
    end

    def integration_store(account_id)
      account_id = validate_account_id(account_id)
      account_id.present? ? IntegrationStores::Pluggy.pluggy_account_store(account_id) : IntegrationStores::Pluggy.pluggy
    end

    def default_headers
      # we should have the default header for all endpoints, except for token who generates the api key
      @endpoint_key == :token ? {} : IntegrationStores::Pluggy.pluggy_auth_header(api_key:)
    end

    def api_key
      config = parent_store.config
      api_key = config[:api_key]
      expires_at = DateTime.parse(config[:api_key_expires_at] || '2099-01-01')

      # if the api_key is present and not expired, return it
      return api_key if api_key.present? && expires_at.present? && expires_at > Time.current + 5.minutes

      # otherwise, refresh it
      refresh_api_key
    end

    def refresh_api_key
      result = Integrations::HttpClient.call(
        integration_store: parent_store,
        endpoint_key: :token,
        payload: IntegrationStores::Pluggy.pluggy_token_payload
      )
      if result.success?
        upsert_api_key(result.response)
      else
        context.fail!(error: result.error)
      end
    end

    def upsert_api_key(response)
      default_expiry = parent_store.config[:default_expiry]
      response_body = JSON.parse(response.body, symbolize_names: true)
      fresh_api_key = response_body[:apiKey]
      expires_at = Time.current + default_expiry.hours

      # after refreshing the api key, we should update the config (which will cache it)
      parent_store.upsert_config({ api_key: fresh_api_key, api_key_expires_at: expires_at.to_s })

      fresh_api_key
    end

    def parent_store
      @integration_store.parent_store || @integration_store
    end
  end
end
