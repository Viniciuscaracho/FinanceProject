# frozen_string_literal: true

# == Schema Information
#
# Table name: integration_stores
#
#  id            :bigint           not null, primary key
#  description   :text
#  integrated_at :datetime
#  name          :string           not null
#  state         :string
#  store_type_cd :integer          not null
#  type          :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint
#  parent_id     :bigint
#
# Indexes
#
#  idx_integrations_stores_uniq            (type,store_type_cd,account_id) UNIQUE
#  index_integration_stores_on_account_id  (account_id)
#  index_integration_stores_on_parent_id   (parent_id)
#  index_integration_stores_on_state       (state)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require 'test_helper'

class IntegrationStoreTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @integration_store = create_sample_store
    @integration_store.upsert_config({
                                       api_key: 'test_key',
                                       host: 'https://test.host.com',
                                       allowed_hosts: %w[127.0.0.1 localhost]
                                     })
    @integration_store.upsert_endpoint(:test_endpoint, { method: Net::HTTP::Post::METHOD, uri: '/api/test' })
    @child_store = create_sample_child_store(@account, @integration_store)
  end

  test 'should retrieve config' do
    config = @integration_store.config
    assert_equal 'test_key', config[:api_key]
    assert_equal 'https://test.host.com', config[:host]
    assert_equal %w[127.0.0.1 localhost], config[:allowed_hosts]
  end

  test 'should retrieve endpoint' do
    endpoint = @integration_store.endpoint(:test_endpoint)
    assert_equal Net::HTTP::Post::METHOD, endpoint[:method]
    assert_equal '/api/test', endpoint[:uri]
  end

  test 'should upsert config' do
    assert_equal 7, @integration_store.config.keys.count
    @integration_store.upsert_config({
                                       api_key: 'test_key_2',
                                       host: 'https://test.host2.com',
                                       new_stuff: 'test'
                                     })
    assert_equal 'test_key_2', @integration_store.config[:api_key]
    assert_equal 'https://test.host2.com', @integration_store.config[:host]
    assert_equal 'test', @integration_store.config[:new_stuff]
    assert_equal 8, @integration_store.config.keys.count
  end

  test 'should upsert endpoint' do
    assert_equal 10, @integration_store.endpoints.keys.count

    @integration_store.upsert_endpoint(:test_endpoint, { method: Net::HTTP::Put::METHOD, uri: '/api/test_changed' })
    @integration_store.upsert_endpoint(:new_endpoint, { method: Net::HTTP::Post::METHOD, uri: '/api/test2' })

    assert_equal 11, @integration_store.endpoints.keys.count
    assert_equal Net::HTTP::Put::METHOD, @integration_store.endpoint(:test_endpoint)[:method]
    assert_equal '/api/test_changed', @integration_store.endpoint(:test_endpoint)[:uri]
    assert_equal Net::HTTP::Post::METHOD, @integration_store.endpoint(:new_endpoint)[:method]
    assert_equal '/api/test2', @integration_store.endpoint(:new_endpoint)[:uri]
  end

  test 'should retrieve pluggy store' do
    pluggy_store = IntegrationStores::Pluggy.pluggy
    assert_equal Integrations::Pluggy::NAME, pluggy_store.name
    assert_equal IntegrationStore::STORE_TYPES[:open_banking], pluggy_store.store_type_cd
  end

  test 'should retrieve pluggy config and endpoint' do
    pluggy_config = IntegrationStores::Pluggy.pluggy_config
    assert_equal 'test_key', pluggy_config[:api_key]
    assert_equal 'https://test.host.com', pluggy_config[:host]

    pluggy_endpoint = IntegrationStores::Pluggy.pluggy_endpoint(:test_endpoint)
    assert_equal Net::HTTP::Post::METHOD, pluggy_endpoint[:method]
    assert_equal '/api/test', pluggy_endpoint[:uri]
  end

  test 'should retrieve pluggy account store' do
    pluggy_account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    assert_equal Integrations::Pluggy::NAME, pluggy_account_store.name
    assert_equal IntegrationStore::STORE_TYPES[:open_banking], pluggy_account_store.store_type_cd
    assert_equal @account.id, pluggy_account_store.account_id
    assert_equal @integration_store.id, pluggy_account_store.parent_id
  end

  test 'should validate endpoint' do
    error = assert_raises(ArgumentError) do
      @integration_store.upsert_endpoint(:test_endpoint, { other: '', method: 'any', uri: '/api/test/{{id}}' })
    end
    assert_equal 'Endpoint must be a hash with method and uri keys', error.message

    error = assert_raises(ArgumentError) do
      @integration_store.upsert_endpoint(:test_endpoint, { method: 'any', uri: '/api/test/{{id}}' })
    end
    assert_equal 'Endpoint method must be a valid HTTP method', error.message
  end

  test 'should retrieve endpoint from parent store' do
    assert @child_store.settings(:endpoints).value.blank?
    endpoint = @child_store.endpoint(:test_endpoint)
    assert_equal Net::HTTP::Post::METHOD, endpoint[:method]
    assert_equal '/api/test', endpoint[:uri]
  end
end
