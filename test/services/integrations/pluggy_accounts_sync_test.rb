# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyAccountsSyncTest < ActiveSupport::TestCase
    setup do
      @user, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should sync pluggy accounts' do
      @account_store.upsert_config({ item_id: '1234' })
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :accounts,
                                                     params: {}).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: mocked_results
                                                         }
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).with(
        integration_store: @account_store,
        endpoint: :accounts,
        response: mocked_results,
        last_update: :updatedAt,
        active_check: false,
        external_entity: :accounts,
        external_id: :id,
        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync],
        tied_to: nil
      ).returns(
        OpenStruct.new(
          success?: true
        )
      )
      now = Time.current
      Time.stubs(:current).returns(now)
      Integrations::PluggyAccountsSync.call(account_id: @account.id,
                                            sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal now.to_s, @account_store.reload.config[:last_accounts_sync]
    end

    test 'should fail if account is not connected to pluggy' do
      @account_store.upsert_config({ item_id: nil })
      result = Integrations::PluggyAccountsSync.call(account_id: @account.id,
                                                     sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal "Account #{@account.id} not connected to Pluggy", result.error
    end

    test 'should fail if pluggy client fails' do
      @account_store.upsert_config({ item_id: '1234' })
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :accounts,
                                                     params: {}).returns(
                                                       OpenStruct.new(
                                                         success?: false,
                                                         failure?: true,
                                                         error: 'error'
                                                       )
                                                     )
      result = Integrations::PluggyAccountsSync.call(account_id: @account.id,
                                                     sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal 'error', result.error
    end

    test 'should fail if batch upsert relationships fails' do
      @account_store.upsert_config({ item_id: '1234' })
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :accounts,
                                                     params: {}).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: mocked_results
                                                         }
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).with(
        integration_store: @account_store,
        endpoint: :accounts,
        response: mocked_results,
        last_update: :updatedAt,
        active_check: false,
        external_entity: :accounts,
        external_id: :id,
        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync],
        tied_to: nil
      ).returns(
        OpenStruct.new(
          success?: false,
          failure?: true,
          failed_data: [{ error: 'error' }]
        )
      )
      result = Integrations::PluggyAccountsSync.call(account_id: @account.id,
                                                     sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal 'error', result.error
    end

    private

    def mocked_results
      [
        {
          id: '1234',
          name: 'Pluggy Account',
          type: 'bank',
          number: '1234',
          balance: 1000,
          currency: 'MXN',
          status: 'active',
          updatedAt: '2020-01-01T00:00:00.000Z'
        }
      ]
    end
  end
end
