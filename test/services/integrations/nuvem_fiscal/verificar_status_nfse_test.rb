# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class VerificarStatusNfseTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @relationship = @account_store.relationship_stores.create!({
                                                                     internal_entity: 'any_entity',
                                                                     internal_id: '1',
                                                                     external_entity: 'nfse',
                                                                     external_id: 'nfse_id',
                                                                     source_last_update: Time.current,
                                                                     account_id: @account.id,
                                                                     sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                     raw_data: { id: 1 },
                                                                     endpoint: @integration_store.endpoint_url(:emitir_nfse),
                                                                     direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                   })
        mock_response = file_fixture('nuvem_fiscal/emitir_nfse.json').read
        @mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        @relationship.add_sender_log(endpoint_key: :emitir_nfse, params: { any: 'any' }, payload: { any: 1 })
        @relationship.update_sender_log(response: @mock_json_response, status: :processing, code: 200)
        @relationship.reload
      end

      test 'should check nfse status in Nuvem Fiscal and update logs to processing' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_nfse,
          account_id: @account.id,
          params: { uri: { nfse_id: 'nfse_id' } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: @mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: @mock_json_response
            )
          )
        )
        assert @relationship.sender_processing?
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call(relationship_id: @relationship.id)
        assert result.success?
        assert :processing, result.relationship.sender_processing?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should check nfse status in Nuvem Fiscal and update logs to success' do
        mock_response = file_fixture('nuvem_fiscal/consultar_nfse_autorizada.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_nfse,
          account_id: @account.id,
          params: { uri: { nfse_id: 'nfse_id' } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_json_response
            )
          )
        )
        assert @relationship.sender_processing?
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call(relationship_id: @relationship.id)
        assert result.success?
        assert :success, result.relationship.sender_synced?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should check nfse status in Nuvem Fiscal and update logs to failed when erro result' do
        mock_response = file_fixture('nuvem_fiscal/consultar_nfse_erro.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_nfse,
          account_id: @account.id,
          params: { uri: { nfse_id: 'nfse_id' } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_json_response
            )
          )
        )
        assert @relationship.sender_processing?
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call(relationship_id: @relationship.id)
        assert result.success?
        assert :failed, result.relationship.sender_failed?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should check nfse status in Nuvem Fiscal and update logs to failed when negada result' do
        mock_response = file_fixture('nuvem_fiscal/consultar_nfse_negada.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_nfse,
          account_id: @account.id,
          params: { uri: { nfse_id: 'nfse_id' } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_json_response
            )
          )
        )
        assert @relationship.sender_processing?
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call(relationship_id: @relationship.id)
        assert result.success?
        assert :failed, result.relationship.sender_failed?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should fail when relationship id is not present' do
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call
        assert result.failure?
        assert 'Relationship id is required', result
      end

      test 'should fail when relationship not found' do
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call(relationship_id: 0)
        assert result.failure?
        assert 'Relationship not found', result
      end
    end
  end
end
