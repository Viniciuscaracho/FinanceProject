# frozen_string_literal: true

require 'test_helper'

module Webhooks
  class PluggyControllerTest < ActionDispatch::IntegrationTest
    setup do
      @user, @account = register_user
      sign_in(@user)
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
      @payload = {
        event: 'item/created',
        itemId: '1234'
      }
    end

    test 'should successfully receive hooks' do
      expected_params = @payload.merge(id: @account.id.to_s, action: 'update',
                                       controller: 'webhooks/pluggy').with_indifferent_access
      Integrations::PluggyHooks.expects(:call).with(account: @account, payload: expected_params).returns(
        OpenStruct.new(
          success?: true
        )
      )
      post webhooks_pluggy_account_url(@account.id), params: @payload
      assert_response :ok
    end

    test 'should return error if invalid host' do
      post webhooks_pluggy_account_url(@account.id), params: @payload, headers: { 'REMOTE_ADDR': '192.168.0.1' }
      assert_response :forbidden
      assert_equal 'Invalid host', JSON.parse(response.body)['error']
    end

    test 'should return error if invalid event' do
      @payload[:event] = 'invalid_event'
      expected_params = @payload.merge(id: @account.id.to_s, action: 'update',
                                       controller: 'webhooks/pluggy').with_indifferent_access
      Integrations::PluggyHooks.expects(:call).with(account: @account, payload: expected_params).returns(
        OpenStruct.new(
          success?: false,
          error: 'Invalid hook event'
        )
      )
      post webhooks_pluggy_account_url(@account.id), params: @payload
      assert_response :unprocessable_entity
      assert_equal 'Invalid hook event', JSON.parse(response.body)['error']
    end
  end
end
