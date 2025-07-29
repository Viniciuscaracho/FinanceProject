# frozen_string_literal: true

require 'test_helper'

module Integrations
  class UpsertRelationshipsTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @integration_store = create_sample_store
      @integration_store.upsert_endpoint(:test_endpoint, { method: 'GET', uri: '/test' })
    end

    test 'should create a simple relationship' do
      response = sample_response
      result = Integrations::UpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                      response:, last_update: response[:updated_at],
                                                      external_entity: 'account_info', external_id: response[:id],
                                                      sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])

      assert result.success?
      assert result.relationship.present?
      assert RelationshipStore.count.positive?
    end

    test 'should create a simple relationship tied to another one' do
      response = sample_response
      result = Integrations::UpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                      response:, last_update: response[:updated_at],
                                                      external_entity: 'account_info', external_id: response[:id],
                                                      sync_type: RelationshipStore::SYNC_TYPES[:auto_sync])
      first_relationship = result.relationship
      result = Integrations::UpsertRelationships.call(integration_store: @integration_store, endpoint: :test_endpoint,
                                                      response:, last_update: response[:updated_at],
                                                      external_entity: 'account_info', external_id: SecureRandom.uuid,
                                                      sync_type: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                      tied_to: first_relationship)

      assert result.success?
      assert result.relationship.present?
      assert_equal 2, RelationshipStore.count
      assert_equal first_relationship.id, result.relationship.parent_id
    end

    test 'should update a simple relationship' do
      relationship = @integration_store.relationship_stores.create!({
                                                                      external_entity: 'account_info',
                                                                      external_id: '1',
                                                                      source_last_update: Time.current - 2.years,
                                                                      sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                      raw_data: { id: 1 },
                                                                      endpoint: @integration_store.endpoint_url(:test_endpoint)
                                                                    })

      response = sample_response
      result = Integrations::UpsertRelationships.call(integration_store: @integration_store,
                                                      external_entity: 'account_info', external_id: response[:id],
                                                      response:, last_update: response[:updated_at],
                                                      active: response[:status] == 'active',
                                                      internal_id: @account.id, internal_entity: @account.class.table_name)

      relationship.reload
      assert result.success?
      assert_equal response[:first_name], relationship.raw_data['first_name']
      assert_equal DateTime.parse(response[:updated_at]), relationship.source_last_update
      assert_equal @account.id, relationship.internal_id
      assert_equal @account.class.table_name, relationship.internal_entity
      assert_equal 1, RelationshipStore.count
    end

    test 'should destroy a simple relationship' do
      @integration_store.relationship_stores.create!({
                                                       external_entity: 'account_info',
                                                       external_id: '1',
                                                       source_last_update: Time.current - 2.years,
                                                       sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                       raw_data: { id: 1 },
                                                       endpoint: @integration_store.endpoint_url(:test_endpoint)
                                                     })

      response = sample_response
      response[:status] = 'inactive'
      result = Integrations::UpsertRelationships.call(integration_store: @integration_store,
                                                      external_entity: 'account_info', external_id: response[:id],
                                                      response:, last_update: response[:updated_at],
                                                      active: response[:status] == 'active',
                                                      internal_id: @account.id, internal_entity: @account.class.table_name)

      assert result.success?
      assert RelationshipStore.count.zero?
    end

    test 'should not update the relationship' do
      source_last_update = Time.current - 2.years
      relationship = @integration_store.relationship_stores.create!({
                                                                      external_entity: 'account_info',
                                                                      external_id: '1',
                                                                      source_last_update: source_last_update,
                                                                      sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                      raw_data: { id: 1 },
                                                                      endpoint: @integration_store.endpoint_url(:test_endpoint)
                                                                    })

      response = sample_response
      response[:updated_at] = source_last_update.to_json
      result = Integrations::UpsertRelationships.call(integration_store: @integration_store,
                                                      external_entity: 'account_info', external_id: response[:id],
                                                      response:, last_update: response[:updated_at],
                                                      active: response[:status] == 'active')

      relationship.reload
      assert result.success?
      assert_nil relationship.raw_data['first_name']
      # compare dates without milliseconds
      assert_equal DateTime.parse(response[:updated_at]).to_time.to_s, relationship.source_last_update.to_s
      assert_equal 1, RelationshipStore.count
    end

    private

    def sample_response
      {
        id: 1,
        first_name: 'Pieter',
        last_name: 'Madelin',
        bank: 'Bank of America',
        email: 'pmadelin0@webmd.com',
        gender: 'Male',
        ip_address: '126.30.218.213',
        status: 'active',
        updated_at: '2023-01-01T00:00:00.000Z'
      }
    end
  end
end
