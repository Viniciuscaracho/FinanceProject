# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyControllerTest < ActionDispatch::IntegrationTest
    setup do
      @user, @account = register_user
      @integration_store = create_sample_store
      sign_in(@user)
    end

    test 'should get status disconnected' do
      get integrations_pluggy_status_url
      assert_response :success
      assert_equal({ status: :disconnected }.to_json, @response.body)
    end

    test 'should get status connected' do
      account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
      account_store.upsert_config({ item_id: '123' })
      get integrations_pluggy_status_url
      assert_response :success
      assert_equal({ status: :connected }.to_json, @response.body)
    end

    test 'should fail to get connect token if already connected' do
      account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
      account_store.upsert_config({ item_id: '123' })
      get integrations_pluggy_connect_token_url
      assert_response :bad_request
      assert_equal({ message: 'Account already connected' }.to_json, @response.body)
    end

    test 'should get connect token and save into account store config' do
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :connect_token,
                                                     params: {}).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         failure?: false,
                                                         response: OpenStruct.new(
                                                           body: { accessToken: '123' },
                                                           code: '200'
                                                         ),
                                                         body: { accessToken: '123' }
                                                       )
                                                     )
      get integrations_pluggy_connect_token_url
      assert_response :success
      assert_equal({ connect_token: '123' }.to_json, @response.body)
      assert_equal '123', @account.pluggy_store.config[:connect_token]
    end

    test 'should fail to get connect token' do
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :connect_token,
                                                     params: {}).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         failure?: false,
                                                         error: nil,
                                                         response: OpenStruct.new(
                                                           code: 422,
                                                           body: { message: 'Failure' }
                                                         ),
                                                         body: { message: 'Failure' }
                                                       )
                                                     )
      get integrations_pluggy_connect_token_url
      assert_response :unprocessable_entity
      assert_equal({ error: { message: 'Failure' } }.to_json, @response.body)
    end
  end
end
