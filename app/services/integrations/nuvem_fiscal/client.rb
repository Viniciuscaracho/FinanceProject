# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # This is the client that will be used to communicate with Nuvem Fiscal API
    class Client < ApplicationService
      def call
        initialize_vars
        result = send_request
        if result.success?
          context.response = result.response
          begin
            context.body = JSON.parse(result.response.body, symbolize_names: true) if result.response.body.present?
          rescue JSON::ParserError
            context.fail!(error: 'Serviço de NFS-e indisponível no momento. Por favor, tente novamente mais tarde.')
          end
        else
          context.fail!(error: result.error)
        end
      end

      private

      def initialize_vars
        @endpoint_key = context.endpoint_key.presence || context.fail!(error: 'Endpoint key is required')
        account_id = context.account_id.presence || context.fail!(error: 'Account id is required')
        @integration_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(account_id)
        @params = context.params || {}
        @payload = context.payload || {}
        @headers = (context.headers || {}).merge(default_headers).merge(auth_header)
      end

      def send_request
        Integrations::HttpClient.call(
          integration_store: @integration_store,
          endpoint_key: @endpoint_key,
          payload: @payload.merge(fetch_payload),
          headers: @headers,
          params: @params.merge(account_params)
        )
      rescue StandardError => e
        context.fail!(error: e.message)
      end

      def fetch_payload
        {}
      end

      def account_params
        {}
      end

      def default_headers
        {}
      end

      def auth_header
        config = parent_store.config
        access_token = config[:access_token]
        expires_at = DateTime.parse(config[:access_token_expires_at] || '2099-01-01')

        # if the api_key is present and not expired, return it
        if access_token.present? && expires_at.present? && expires_at > Time.current + 5.minutes
          return { 'Authorization': "Bearer #{access_token}" }
        end

        # otherwise, refresh it
        { 'Authorization': "Bearer #{refresh_access_token(config)}" }
      end

      def refresh_access_token(config)
        oauth_url = config[:oauth_url]
        scopes = config[:scopes_nfse]
        client_id = config[:client_id]
        client_secret = config[:client_secret]

        # create an http post request to the oauth_url
        # use the client_id and client_secret as x-www-form-urlencoded with grant_type=client_credentials and scope
        # check the result status code, if 200, parse the response body and return the access_token and expires_in
        # convert the expires_in to a datetime expires_at and return { access_token: access_token, expires_at: expires_at }
        result = Net::HTTP.post_form(URI(oauth_url), grant_type: 'client_credentials', scope: scopes.join(' '),
                                                         client_id:, client_secret:)
        if result.code == '200'
          upsert_access_token(result)
        else
          context.fail!(error: "Failed to authenticate with Nuvem Fiscal: #{result.body}")
        end
      end

      def upsert_access_token(result)
        response_body = JSON.parse(result.body, symbolize_names: true)
        access_token = response_body[:access_token]
        expires_at = Time.current + response_body[:expires_in].seconds
        parent_store.upsert_config({ access_token:, access_token_expires_at: expires_at.to_s })
        access_token
      end

      def parent_store
        @integration_store.parent_store || @integration_store
      end
    end
  end
end
