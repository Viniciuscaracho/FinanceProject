# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyItemSyncTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should sync pluggy item' do
      @account_store.upsert_config({ item_id: '1234' })
      mocked_result = pluggy_response('item')
      mocked_json_result = JSON.parse(mocked_result, symbolize_names: true)
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :item, params: {}).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            code: '200',
            body: mocked_result
          ),
          body: mocked_json_result
        )
      )
      Integrations::UpsertRelationships.expects(:call).with(
        integration_store: @account_store,
        endpoint: :item,
        response: mocked_json_result,
        last_update: '2023-12-20T17:30:51.979Z',
        active: true,
        external_entity: :item,
        external_id: '25dcb0ea-d2e9-4510-aa44-f28e9fbd053b',
        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync]
      ).returns(
        OpenStruct.new(
          success?: true
        )
      )
      now = Time.current
      Time.stubs(:current).returns(now)
      Integrations::PluggyItemSync.call(account_id: @account.id,
                                        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal now.to_s, @account_store.reload.config[:last_item_sync]
    end

    test 'should fail if account is not connected to pluggy' do
      @account_store.upsert_config({ item_id: nil })
      result = Integrations::PluggyItemSync.call(account_id: @account.id,
                                                 sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal "Account #{@account.id} not connected to Pluggy", result.error
    end

    test 'should fail if pluggy client fails' do
      @account_store.upsert_config({ item_id: '1234' })
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :item, params: {}).returns(
        OpenStruct.new(
          success?: false,
          failure?: true,
          error: 'error'
        )
      )
      result = Integrations::PluggyItemSync.call(account_id: @account.id,
                                                 sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal 'error', result.error
    end

    test 'should fail if upsert relationships fails' do
      @account_store.upsert_config({ item_id: '1234' })
      mocked_result = pluggy_response('item')
      mocked_json_result = JSON.parse(mocked_result, symbolize_names: true)
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :item, params: {}).returns(
        OpenStruct.new(
          success?: true,
          response: OpenStruct.new(
            code: '200',
            body: mocked_result
          ),
          body: mocked_json_result
        )
      )
      Integrations::UpsertRelationships.expects(:call).with(
        integration_store: @account_store,
        endpoint: :item,
        response: mocked_json_result,
        last_update: '2023-12-20T17:30:51.979Z',
        active: true,
        external_entity: :item,
        external_id: '25dcb0ea-d2e9-4510-aa44-f28e9fbd053b',
        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync]
      ).returns(
        OpenStruct.new(
          success?: false,
          failure?: true,
          error: 'error'
        )
      )
      result = Integrations::PluggyItemSync.call(account_id: @account.id,
                                                 sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal 'error', result.error
    end
  end
end
