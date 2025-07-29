# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class ClientTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @integration_store.upsert_config(access_token: mocked_access_token[:access_token],
                                         access_token_expires_at: (Time.current + 1.hour).to_s)
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
      end

      test 'should validate endpoint key presence' do
        result = Integrations::NuvemFiscal::Client.call
        assert result.failure?
        assert_equal 'Endpoint key is required', result.error
      end

      test 'should validate account id presence' do
        result = Integrations::NuvemFiscal::Client.call(endpoint_key: :cadastrar_empresas)
        assert result.failure?
        assert_equal 'Account id is required', result.error
      end

      test 'should refresh access_token' do
        @integration_store.upsert_config({ access_token: nil, access_token_expires_at: nil })
        @integration_store.reload
        uri = URI('https://auth.nuvemfiscal.com.br/oauth/token')
        URI.expects(:parse).with('https://auth.nuvemfiscal.com.br/oauth/token').returns(uri)
        Net::HTTP.expects(:post_form).with(
          uri,
          grant_type: 'client_credentials',
          scope: 'empresa nfse',
          client_id: 'AnUGHKLiUttBP5oXHkAw',
          client_secret: '7r4TnLfze9GTSETBO4n60yzUODzoPvBy6z9zIIz9'
        ).returns(
          Net::HTTPResponse.new(
            '1.1',
            '200',
            'OK'
          ).tap do |response|
            response.stubs(:body).returns(mocked_access_token.to_json)
          end
        )
        Integrations::HttpClient.expects(:call).with(
          integration_store: @account_store.reload,
          endpoint_key: :cadastrar_empresas,
          payload: {},
          params: {},
          headers: { 'Authorization': "Bearer #{mocked_access_token[:access_token]}" }
        ).returns(
          OpenStruct.new(
            success?: true,
            response: OpenStruct.new(
              body: {}.to_json
            )
          )
        )
        result = Integrations::NuvemFiscal::Client.call(endpoint_key: :cadastrar_empresas, account_id: @account.id)
        assert result.success?

        config = @integration_store.reload.config
        assert_equal mocked_access_token[:access_token], config[:access_token]
        assert_not_nil config[:access_token_expires_at]
      end

      test 'should fail to refresh access_token' do
        @integration_store.upsert_config({ access_token: nil, access_token_expires_at: nil })
        @integration_store.reload
        uri = URI('https://auth.nuvemfiscal.com.br/oauth/token')
        URI.expects(:parse).with('https://auth.nuvemfiscal.com.br/oauth/token').returns(uri)
        Net::HTTP.expects(:post_form).with(
          uri,
          grant_type: 'client_credentials',
          scope: 'empresa nfse',
          client_id: 'AnUGHKLiUttBP5oXHkAw',
          client_secret: '7r4TnLfze9GTSETBO4n60yzUODzoPvBy6z9zIIz9'
        ).returns(
          Net::HTTPResponse.new(
            '1.1',
            '500',
            'Internal Server Error'
          ).tap do |response|
            response.stubs(:body).returns({ error: 'Error' }.to_json)
          end
        )
        result = Integrations::NuvemFiscal::Client.call(endpoint_key: :cadastrar_empresas, account_id: @account.id)
        assert result.failure?

        config = @integration_store.reload.config
        assert_nil config[:access_token]
        assert_nil config[:access_token_expires_at]
        assert_equal 'Failed to authenticate with Nuvem Fiscal: {"error":"Error"}', result.error
      end

      private

      def mocked_access_token
        {
          "access_token": 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9',
          "expires_in": 2_592_000
        }
      end
    end
  end
end
