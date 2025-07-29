# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyTransactionsSyncTest < ActiveSupport::TestCase
    setup do
      @user, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should sync pluggy transactions' do
      @account_store.upsert_config({ item_id: '1234' })
      account = @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :transactions,
                                                     params: { uri: { account_id: '1234' } }).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: mocked_results
                                                         }
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).with(
        integration_store: @account_store,
        endpoint: :transactions,
        response: mocked_results,
        last_update: :updatedAt,
        active_check: false,
        external_entity: :transactions,
        external_id: :id,
        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync],
        tied_to: account
      ).returns(
        OpenStruct.new(
          success?: true
        )
      )
      now = Time.current
      Time.stubs(:current).returns(now)
      Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal now.to_s, @account_store.reload.config[:last_transactions_sync]
    end

    test 'should fail if account is not connected to pluggy' do
      @account_store.upsert_config({ item_id: nil })
      result = Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                         sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal "Account #{@account.id} not connected to Pluggy", result.error
    end

    test 'should fail if the account doest not have pluggy accounts synced' do
      @account_store.upsert_config({ item_id: '1234' })
      result = Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                         sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal "Account #{@account.id} not has accounts synced", result.error
    end

    test 'should fail if pluggy client fails' do
      @account_store.upsert_config({ item_id: '1234' })
      @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :transactions,
                                                     params: { uri: { account_id: '1234' } }).returns(
                                                       OpenStruct.new(
                                                         success?: false,
                                                         failure?: true,
                                                         error: 'error'
                                                       )
                                                     )
      result = Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                         sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal 'error', result.error
    end

    test 'should fail if batch upsert fails' do
      @account_store.upsert_config({ item_id: '1234' })
      account = @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :transactions,
                                                     params: { uri: { account_id: '1234' } }).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: mocked_results
                                                         }
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).with(
        integration_store: @account_store,
        endpoint: :transactions,
        response: mocked_results,
        last_update: :updatedAt,
        active_check: false,
        external_entity: :transactions,
        external_id: :id,
        sync_type: RelationshipStore::SYNC_TYPES[:initial_sync],
        tied_to: account
      ).returns(
        OpenStruct.new(
          failure?: true,
          failed_data: [
            {
              error: 'error'
            }
          ]
        )
      )
      result = Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                         sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
      assert_equal false, result.success?
      assert_equal true, result.failure?
      assert_equal 'error', result.error
    end

    test 'should log error if transactions result is blank and the API is flagging more results' do
      @account_store.upsert_config({ item_id: '1234' })
      @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :transactions,
                                                     params: { uri: { account_id: '1234' } }).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: []
                                                         },
                                                         has_more?: true
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).never
      Rails.logger.expects(:error).with("No transactions found for account #{@account.id}")
      Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
    end

    test 'should not execute the batch upsert if the results are blank' do
      @account_store.upsert_config({ item_id: '1234' })
      @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :transactions,
                                                     params: { uri: { account_id: '1234' } }).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: []
                                                         },
                                                         has_more?: false
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).never
      Rails.logger.expects(:error).never
      Integrations::PluggyTransactionsSync.call(account_id: @account.id,
                                                sync_type: RelationshipStore::SYNC_TYPES[:initial_sync])
    end

    test 'should delete transactions' do
      @account_store.upsert_config({ item_id: '1234' })
      @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).never
      Integrations::BatchUpsertRelationships.expects(:call).never

      now = Time.current
      Time.stubs(:current).returns(now)
      Integrations::PluggyTransactionsSync.call(account_id: @account.id, sync_type: RelationshipStore::SYNC_TYPES[:webhook_sync], transaction_ids: ['1234'])
      assert_equal now.to_s, @account_store.reload.config[:last_transactions_deletion]
      assert_equal 0, @account_store.relationship_stores.count
    end

    test 'should merge params' do
      @account_store.upsert_config({ item_id: '1234' })
      @account_store.relationship_stores.create!(
        external_entity: :accounts,
        external_id: '1234',
        sync_type_cd: RelationshipStore::SYNC_TYPES[:initial_sync]
      )
      Integrations::PluggyClient.expects(:call).with(account_id: @account.id, endpoint_key: :transactions,
                                                     params: { uri: { account_id: '1234' }, query: { from: '2023-01-01' } }).returns(
                                                       OpenStruct.new(
                                                         success?: true,
                                                         body: {
                                                           results: []
                                                         },
                                                         has_more?: false
                                                       )
                                                     )
      Integrations::BatchUpsertRelationships.expects(:call).never
      Integrations::PluggyTransactionsSync.call(account_id: @account.id, sync_type: RelationshipStore::SYNC_TYPES[:webhook_sync], params: { query: { from: '2023-01-01' } })
    end

    private

    def mocked_results
      [
        {
          id: '1234',
          updatedAt: '2020-01-01T00:00:00.000Z',
          name: 'name',
          amount: 1,
          currency: 'USD',
          date: '2020-01-01T00:00:00.000Z',
          status: 'status',
          type: 'type',
          category: 'category',
          account_id: '1234'
        }
      ]
    end
  end
end
