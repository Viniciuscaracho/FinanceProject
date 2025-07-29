# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class DataSenderBaseTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
      end

      test 'should validate integration_store implementation' do
        result = Integrations::DataSenderBase.call(
          account_id: @account.id,
          internal_entity: @account.company,
          endpoint_key: :test,
          sync_type: RelationshipStore::SYNC_TYPES[:auto_sync],
          payload: {}
        )
        assert result.failure?
        assert_equal 'Method integration_store not implemented', result.error
      end

      test 'should validate internal entity presence' do
        result = TestSuccessSender.call(account_id: @account.id)
        assert result.failure?
        assert_equal 'Internal entity is required', result.error
      end

      test 'should validate account id presence' do
        result = TestSuccessSender.call(
          internal_entity: @account.company
        )
        assert result.failure?
        assert_equal 'Account id is required', result.error
      end

      test 'should validate endpoint key presence' do
        result = TestSuccessSender.call(
          internal_entity: @account.company, account_id: @account.id
        )
        assert result.failure?
        assert_equal 'Endpoint key is required', result.error
      end

      test 'should validate sync type presence' do
        result = TestSuccessSender.call(
          internal_entity: @account.company, account_id: @account.id, endpoint_key: :test
        )
        assert result.failure?
        assert_equal 'Sync type is required', result.error
      end

      test 'should validate payload presence' do
        @integration_store.upsert_endpoint(:test, method: Net::HTTP::Post::METHOD, uri: '/test')
        result = TestSuccessSender.call(
          internal_entity: @account.company, account_id: @account.id,
          endpoint_key: :test, sync_type: :test
        )
        assert result.failure?
        assert_equal 'Payload is required', result.error
      end

      test 'should required the implementation of send_request' do
        result = TestMissingSender.call(
          internal_entity: @account.company, account_id: @account.id,
          endpoint_key: :cadastrar_empresa,
          sync_type: RelationshipStore::SYNC_TYPES[:auto_sync], payload: {}
        )
        assert result.failure?
        assert_equal 'Method send_request not implemented', result.error
      end

      test 'should successfully validate the api result and have success sender logs' do
        result = TestSuccessSender.call(
          internal_entity: @account.company, account_id: @account.id,
          endpoint_key: :cadastrar_empresa,
          sync_type: RelationshipStore::SYNC_TYPES[:auto_sync], payload: {}
        )
        assert result.success?
        assert_equal({ id: 1 }, result.body)
        assert_equal 1, result.relationship.sender_logs.count
        assert_equal 'cadastrar_empresa', result.relationship.sender_logs.first[:endpoint_key]
        assert_equal({}, result.relationship.sender_logs.first[:payload])
        assert_equal({}, result.relationship.sender_logs.first[:params])
        assert_equal 'success', result.relationship.sender_logs.first[:status]
        assert_equal({ 'id' => 1 }, result.relationship.sender_logs.first[:response])
        assert_equal 200, result.relationship.sender_logs.first[:code]
      end

      test 'should fail to validate the api result and have failed sender logs' do
        result = TestFailSender.call(
          internal_entity: @account.company, account_id: @account.id,
          endpoint_key: :cadastrar_empresa,
          sync_type: RelationshipStore::SYNC_TYPES[:auto_sync], payload: {}
        )
        assert result.failure?
        assert_equal 'Request failed with status code: 500', result.error
        assert_equal 1, result.relationship.sender_logs.count
        assert_equal 'cadastrar_empresa', result.relationship.sender_logs.first[:endpoint_key]
        assert_equal({}, result.relationship.sender_logs.first[:payload])
        assert_equal({}, result.relationship.sender_logs.first[:params])
        assert_equal 'failed', result.relationship.sender_logs.first[:status]
        assert_equal 'Request failed with status code: 500', result.relationship.sender_logs.first[:error]
        assert_equal({ 'message' => 'Internal Server Error' }, result.relationship.sender_logs.first[:response])
        assert_equal 500, result.relationship.sender_logs.first[:code]
      end

      class TestSuccessSender < Integrations::DataSenderBase
        def send_request
          OpenStruct.new(response: OpenStruct.new(code: 200, body: { id: 1 }.to_json), success?: true)
        end

        def integration_store
          IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account_id)
        end
      end

      class TestMissingSender < Integrations::DataSenderBase
        def integration_store
          IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account_id)
        end
      end

      class TestFailSender < Integrations::DataSenderBase
        def send_request
          OpenStruct.new(response: OpenStruct.new(code: 500, body: { message: 'Internal Server Error' }.to_json),
                         success?: true)
        end

        def integration_store
          IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account_id)
        end
      end
    end
  end
end
