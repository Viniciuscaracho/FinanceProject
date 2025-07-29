# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyClientTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @integration_store = create_sample_store
      @integration_store.upsert_config(api_key: mocked_api_key[:apiKey],
                                       api_key_expires_at: (Time.current + 1.hour).to_s)
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should validate endpoint key presence' do
      result = Integrations::PluggyClient.call
      assert result.failure?
      assert_equal 'Endpoint key is required', result.error
    end

    test 'should validate account id presence for some endpoints' do
      result = Integrations::PluggyClient.call(endpoint_key: :accounts)
      assert result.failure?
      assert_equal 'Account id is required', result.error
    end

    test 'should refresh api key' do
      @integration_store.upsert_config(api_key: nil, api_key_expires_at: nil)
      @integration_store.reload
      Integrations::HttpClient.expects(:call).with(
        integration_store: @integration_store,
        endpoint_key: :token,
        payload: { clientId: 'a0733036-a0c4-4a76-812b-a3cd21f3e61b',
                   clientSecret: '0984be4d-2caa-4d7b-b0a4-86ae477173ac' }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: mocked_api_key.to_json
          )
        )
      )
      result = Integrations::PluggyClient.call(endpoint_key: :token)
      assert result.success?
      assert_not_nil result.response[:api_key]
      assert_not_nil @integration_store.reload.config[:api_key_expires_at]
    end

    test 'should fetch connectors' do
      @integration_store.reload
      Integrations::HttpClient.expects(:call).with(
        integration_store: @integration_store,
        endpoint_key: :connectors,
        params: { query: { isOpenFinance: true } },
        payload: {},
        headers: { 'X-API-KEY': mocked_api_key[:apiKey] }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: pluggy_response(:connectors)
          ),
          body: JSON.parse(pluggy_response(:connectors), symbolize_names: true),
          error: nil
        )
      )
      result = Integrations::PluggyClient.call(endpoint_key: :connectors, params: { query: { isOpenFinance: true } })
      assert result.success?
      assert_equal 2, result.body[:results].count
    end

    test 'should fail to fetch accounts without item_id presence in config' do
      @integration_store.upsert_config(item_id: nil)
      @integration_store.reload
      result = Integrations::PluggyClient.call(endpoint_key: :accounts, account_id: @account.id)
      assert result.failure?
      assert_equal "Pluggy Item id not found for account: #{@account.id}", result.error
    end

    test 'should fetch accounts' do
      @account_store.upsert_config(item_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039')
      @account_store.reload
      Integrations::HttpClient.expects(:call).with(
        integration_store: @account_store,
        endpoint_key: :accounts,
        params: { uri: { item_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039' } },
        payload: {},
        headers: { 'X-API-KEY': mocked_api_key[:apiKey] }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: pluggy_response(:accounts)
          ),
          body: JSON.parse(pluggy_response(:accounts), symbolize_names: true),
          error: nil
        )
      )
      result = Integrations::PluggyClient.call(endpoint_key: :accounts, account_id: @account.id)
      assert result.success?
      assert_equal 2, result.body[:results].count
    end

    test 'should fail to fetch transactions without account_id presence in config' do
      @account_store.upsert_config(credit_card_account_id: nil)
      @account_store.reload
      result = Integrations::PluggyClient.call(endpoint_key: :transactions, account_id: @account.id)
      assert result.failure?
      assert_equal 'Param account_id not found for endpoint URI /transactions?accountId={{account_id}}', result.error
    end

    test 'should fetch transactions' do
      @account_store.reload
      Integrations::HttpClient.expects(:call).with(
        integration_store: @account_store,
        endpoint_key: :transactions,
        params: { uri: { account_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039' } },
        payload: {},
        headers: { 'X-API-KEY': mocked_api_key[:apiKey] }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: pluggy_response(:transactions)
          ),
          body: JSON.parse(pluggy_response(:transactions), symbolize_names: true),
          error: nil
        )
      )
      result = Integrations::PluggyClient.call(endpoint_key: :transactions, account_id: @account.id,
                                               params: { uri: { account_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039' } })
      assert result.success?
      assert_equal 9, result.body[:results].count
    end

    test 'should fetch connect token' do
      @account_store.reload
      Integrations::HttpClient.expects(:call).with(
        integration_store: @account_store,
        endpoint_key: :connect_token,
        params: {},
        payload: {
          itemId: nil,
          options: {
            clientUserId: @account.id.to_s,
            webhookUrl: "http://localhost:3000/webhooks/pluggy/account/#{@account.id}"
          }
        },
        headers: { 'X-API-KEY': mocked_api_key[:apiKey] }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: { accessToken: '123' }.to_json
          ),
          body: JSON.parse({ accessToken: '123' }.to_json, symbolize_names: true),
          error: nil
        )
      )
      result = Integrations::PluggyClient.call(endpoint_key: :connect_token, account_id: @account.id)
      assert result.success?
      assert_equal '123', result.body[:accessToken]
    end

    test 'should paginate the response' do
      @account_store.reload
      transactions_response = pluggy_response(:transactions)
      hash_response = JSON.parse(transactions_response, symbolize_names: true)
      first_page_response = hash_response.merge(page: 1, totalPages: 2)
      second_page_response = hash_response.merge(page: 2, totalPages: 2)

      Integrations::HttpClient.expects(:call).once.with(
        integration_store: @account_store,
        endpoint_key: :transactions,
        params: { uri: { account_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039' } },
        payload: {},
        headers: { 'X-API-KEY': mocked_api_key[:apiKey] }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: first_page_response.to_json
          ),
          body: first_page_response,
          error: nil
        )
      )
      result = Integrations::PluggyClient.call(endpoint_key: :transactions, account_id: @account.id,
                                               params: { uri: { account_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039' } })
      assert result.success?
      assert_equal 9, result.body[:results].count

      Integrations::HttpClient.expects(:call).once.with(
        integration_store: @account_store,
        endpoint_key: :transactions,
        params: { uri: { account_id: '20da0c58-a2c5-46eb-8fe5-83adfac64039' }, query: { page: 2 } },
        payload: {},
        headers: { 'X-API-KEY': mocked_api_key[:apiKey] }
      ).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            body: second_page_response.to_json
          ),
          body: second_page_response,
          error: nil
        )
      )
      assert result.has_more?
      result_page_2 = result.next.call
      assert result_page_2.success?
      assert_equal 9, result_page_2.body[:results].count
      assert_equal 2, result_page_2.body[:page]
      assert_not result_page_2.has_more?
    end

    private

    def mocked_api_key
      {
        "apiKey": 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9'
      }
    end
  end
end
