# frozen_string_literal: true

require 'test_helper'

module Integrations
  class BatchUpsertRelationshipsTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @integration_store = create_sample_store
    end

    test 'should create two relationships in batch' do
      response = sample_response
      Integrations::UpsertRelationships.expects(:call)
                                       .once
                                       .with(integration_store: @integration_store, external_entity: 'account_info',
                                             external_id: 1, response: response.first, last_update: '2023-01-01T00:00:00.000Z',
                                             active: true, extras: nil, internal_entity: nil, internal_id: nil,
                                             synced_by: nil, synced_at: nil, tied_to: nil,
                                             endpoint: :test_endpoint, sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])
                                       .returns(context1 = mock)
      Integrations::UpsertRelationships.expects(:call)
                                       .once
                                       .with(integration_store: @integration_store, external_entity: 'account_info',
                                             external_id: 2, response: response.second, last_update: '2023-01-01T00:00:00.000Z',
                                             active: true, extras: nil, internal_entity: nil, internal_id: nil,
                                             synced_by: nil, synced_at: nil, tied_to: nil,
                                             endpoint: :test_endpoint, sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])
                                       .returns(context2 = mock)
      context1.expects(:failure?).returns(false)
      context1.expects(:relationship).returns(mock)
      context2.expects(:failure?).returns(false)
      context2.expects(:relationship).returns(mock)
      result = Integrations::BatchUpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                           response:, last_update: :updated_at, active_check: 'active',
                                                           external_entity: 'account_info', external_id: :id,
                                                           active: :status,
                                                           sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])

      assert result.success?
      assert_equal 2, result.relationships.count
      assert_equal 2, result.processed_data.count
      assert_equal 0, result.failed_data.count
    end

    test 'should create fail one and create on relationships in batch' do
      response = sample_response
      Integrations::UpsertRelationships.expects(:call)
                                       .once
                                       .with(integration_store: @integration_store, external_entity: 'account_info',
                                             external_id: 1, response: response.first, last_update: '2023-01-01T00:00:00.000Z',
                                             active: true, extras: nil, internal_entity: nil, internal_id: nil,
                                             synced_by: nil, synced_at: nil, tied_to: nil,
                                             endpoint: :test_endpoint, sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])
                                       .returns(context1 = mock)
      Integrations::UpsertRelationships.expects(:call)
                                       .once
                                       .with(integration_store: @integration_store, external_entity: 'account_info',
                                             external_id: 2, response: response.second, last_update: '2023-01-01T00:00:00.000Z',
                                             active: true, extras: nil, internal_entity: nil, internal_id: nil,
                                             synced_by: nil, synced_at: nil, tied_to: nil,
                                             endpoint: :test_endpoint, sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])
                                       .returns(context2 = mock)
      context1.expects(:failure?).returns(true)
      context1.expects(:error).returns('Failed to create')
      context2.expects(:failure?).returns(false)
      context2.expects(:relationship).returns(mock)
      result = Integrations::BatchUpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                           response:, last_update: :updated_at, active_check: 'active',
                                                           external_entity: 'account_info', external_id: :id,
                                                           active: :status,
                                                           sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])

      assert result.success?
      assert_equal 1, result.relationships.count
      assert_equal 1, result.processed_data.count
      assert_equal 1, result.failed_data.count
      assert_equal 'Failed to create', result.failed_data.first[:error]
      assert_equal response.first, result.failed_data.first[:data]
    end

    test 'should raise accessor error' do
      response = sample_response
      Integrations::UpsertRelationships.expects(:call).never
      result = Integrations::BatchUpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                           response:, last_update: 222, active_check: 'active',
                                                           external_entity: 'account_info', external_id: :id,
                                                           active: :status,
                                                           sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])

      assert result.failure?
      assert_equal 'Accessor must be a symbol or a string', result.error
    end

    test 'should raise array error' do
      response = sample_response.first
      Integrations::UpsertRelationships.expects(:call).never
      result = Integrations::BatchUpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                           response:, last_update: :updated_at, active_check: 'active',
                                                           external_entity: 'account_info', external_id: :id,
                                                           active: :status,
                                                           sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])

      assert result.failure?
      assert_equal 'Response must be an array for batch operation', result.error
    end

    test 'should fail if response is an empty array' do
      response = []
      Integrations::UpsertRelationships.expects(:call).never
      result = Integrations::BatchUpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                           response:, last_update: :updated_at, active_check: 'active',
                                                           external_entity: 'account_info', external_id: :id,
                                                           active: :status,
                                                           sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])

      assert result.failure?
      assert_equal 'Response array must not be empty', result.error
    end

    private

    def sample_response
      [
        {
          id: 1,
          first_name: 'Pieter',
          last_name: 'Madelin',
          bank_info: {
            bank_name: 'Bank of America',
            address: '123 Main St',
            city: 'New York',
            state: 'NY'
          },
          row: {
            metadata: {
              updated_at: '2023-01-01T00:00:00.000Z',
              status: 'active'
            }
          }
        },
        {
          id: 2,
          first_name: 'John',
          last_name: 'Ford',
          bank_info: {
            bank_name: 'Bank of Brazil',
            address: '123 Straddle St',
            city: 'Brasilia',
            state: 'DF'
          },
          row: {
            metadata: {
              updated_at: '2023-01-01T00:00:00.000Z',
              status: 'active'
            }
          }
        }
      ]
    end
  end
end
