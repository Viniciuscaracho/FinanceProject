# frozen_string_literal: true

# == Schema Information
#
# Table name: relationship_stores
#
#  id                   :bigint           not null, primary key
#  direction_cd         :integer          default(0)
#  endpoint             :string
#  external_entity      :string
#  extras               :jsonb
#  internal_entity      :string
#  raw_data             :jsonb
#  source_last_update   :datetime
#  sync_type_cd         :integer          not null
#  synced_at            :datetime
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint
#  external_id          :string
#  integration_store_id :bigint           not null
#  internal_id          :bigint
#  parent_id            :bigint
#  synced_by_id         :bigint
#
# Indexes
#
#  index_relationship_stores_on_account_id                       (account_id)
#  index_relationship_stores_on_external_entity_and_external_id  (external_entity,external_id)
#  index_relationship_stores_on_integration_store_id             (integration_store_id)
#  index_relationship_stores_on_internal_entity_and_internal_id  (internal_entity,internal_id)
#  index_relationship_stores_on_parent_id                        (parent_id)
#  index_relationship_stores_on_sync_type_cd                     (sync_type_cd)
#  index_relationship_stores_on_synced_by_id                     (synced_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (integration_store_id => integration_stores.id)
#  fk_rails_...  (synced_by_id => users.id)
#
require 'test_helper'

class RelationshipStoreTest < ActiveSupport::TestCase
  setup do
    @user, @account = register_user
    @integration_store = create_sample_store
    @child_store = create_sample_child_store(@account, @integration_store)
  end

  test 'should validate synced by presence when manual sync' do
    assert_raises ActiveRecord::RecordInvalid do
      @integration_store.relationship_stores.create!({
                                                       external_entity: 'account_info',
                                                       external_id: '1',
                                                       source_last_update: Time.current,
                                                       sync_type_cd: RelationshipStore::SYNC_TYPES[:manual_sync],
                                                       raw_data: { id: 1 },
                                                       endpoint: @integration_store.endpoint_url(:accounts)
                                                     })
    end
  end

  test 'should return raw data with indifferent access' do
    relationship = @integration_store.relationship_stores.create!({
                                                                    external_entity: 'account_info',
                                                                    external_id: '1',
                                                                    source_last_update: Time.current,
                                                                    sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                    raw_data: { id: 1 },
                                                                    endpoint: @integration_store.endpoint_url(:accounts)
                                                                  })
    assert_equal 1, relationship.raw_data[:id]
    assert_equal 1, relationship.raw_data['id']
  end

  test 'should validate internal entity and id presence when outbound' do
    assert_raises ActiveRecord::RecordInvalid do
      @integration_store.relationship_stores.create!({
                                                       direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound],
                                                       external_entity: 'account_info',
                                                       external_id: '1',
                                                       source_last_update: Time.current,
                                                       sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                       raw_data: { id: 1 },
                                                       endpoint: @integration_store.endpoint_url(:accounts)
                                                     })
    end
  end

  test 'should validate external entity and id presence when inbound' do
    assert_raises ActiveRecord::RecordInvalid do
      @integration_store.relationship_stores.create!({
                                                       direction_cd: RelationshipStore::DIRECTION_TYPES[:inbound],
                                                       internal_entity: 'account_info',
                                                       internal_id: 1,
                                                       source_last_update: Time.current,
                                                       sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                       raw_data: { id: 1 },
                                                       endpoint: @integration_store.endpoint_url(:accounts)
                                                     })
    end
  end

  test 'should return sender logs' do
    relationship = @integration_store.relationship_stores.create!({
                                                                    internal_entity: 'account_info',
                                                                    internal_id: '1',
                                                                    source_last_update: Time.current,
                                                                    sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                    raw_data: { id: 1 },
                                                                    endpoint: @integration_store.endpoint_url(:accounts),
                                                                    direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                  })
    relationship.extras['data_sender_log'] = [{ id: 1, status: 'failed', error: 'Payload is required' }]
    relationship.save!

    assert relationship.sender_logs.present?
    assert_equal 1, relationship.sender_logs.count
    assert_equal 'failed', relationship.sender_logs.first[:status]
    assert_equal 'Payload is required', relationship.sender_logs.first[:error]
  end

  test 'should return last sender log and check if got synced or failed' do
    relationship = @integration_store.relationship_stores.create!({
                                                                    internal_entity: 'account_info',
                                                                    internal_id: '1',
                                                                    source_last_update: Time.current,
                                                                    sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                    raw_data: { id: 1 },
                                                                    endpoint: @integration_store.endpoint_url(:accounts),
                                                                    direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                  })
    relationship.extras['data_sender_log'] = [
      {
        id: 1,
        status: 'failed',
        error: 'Payload is required'
      },
      {
        id: 2,
        status: 'success'
      }
    ]
    relationship.save!

    assert_equal 'success', relationship.last_sync_log[:status]
    assert relationship.sender_synced?

    relationship.update!(extras: { data_sender_log: [{ id: 1, status: 'failed', error: 'Payload is required' }] })
    assert relationship.sender_failed?
  end

  test 'should add sender log' do
    relationship = @integration_store.relationship_stores.create!({
                                                                    internal_entity: 'account_info',
                                                                    internal_id: '1',
                                                                    source_last_update: Time.current,
                                                                    sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                    raw_data: { id: 1 },
                                                                    endpoint: @integration_store.endpoint_url(:accounts),
                                                                    direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                  })
    relationship.add_sender_log(endpoint_key: :accounts, params: { page: 1 }, payload: { id: 1 })
    assert relationship.sender_logs.present?
    assert_equal 1, relationship.sender_logs.count
    assert_equal 'accounts', relationship.sender_logs.first[:endpoint_key]
    assert_equal 1, relationship.sender_logs.first[:params][:page]
    assert_equal 1, relationship.sender_logs.first[:payload][:id]
  end

  test 'should update sender log' do
    relationship = @integration_store.relationship_stores.create!({
                                                                    internal_entity: 'account_info',
                                                                    internal_id: '1',
                                                                    source_last_update: Time.current,
                                                                    sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                    raw_data: { id: 1 },
                                                                    endpoint: @integration_store.endpoint_url(:accounts),
                                                                    direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                  })
    relationship.add_sender_log(endpoint_key: :accounts, params: { page: 1 }, payload: { id: 1 })
    relationship.update_sender_log(response: { message: 'test' }, status: :success, code: 200)
    assert_equal 'success', relationship.last_sync_log[:status]
    assert_equal 'test', relationship.last_sync_log[:response][:message]
    assert_equal 200, relationship.last_sync_log[:code]
    assert relationship.sender_synced?
  end
end
