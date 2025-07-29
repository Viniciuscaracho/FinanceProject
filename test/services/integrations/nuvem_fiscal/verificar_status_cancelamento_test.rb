# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class VerificarStatusCancelamentoTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @relationship = @account_store.relationship_stores.create!({
                                                                     internal_entity: 'any_entity',
                                                                     internal_id: '1',
                                                                     external_entity: 'nfse_cancelamento',
                                                                     external_id: 'nfse_id',
                                                                     source_last_update: Time.current,
                                                                     account_id: @account.id,
                                                                     sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
                                                                     raw_data: { id: 1 },
                                                                     endpoint: @integration_store.endpoint_url(:cancelar_nfse),
                                                                     direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound]
                                                                   })
        mock_response = file_fixture('nuvem_fiscal/cancelar_nfse.json').read
        @mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        @relationship.add_sender_log(endpoint_key: :cancelar_nfse, params: { any: 'any' }, payload: { any: 1 })
        @relationship.update_sender_log(response: @mock_json_response, status: :pending, code: 200)
        @relationship.reload
      end

      test 'should check cancelamento status in Nuvem Fiscal and update logs to pending' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_cancelamento,
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
        assert @relationship.sender_pending?
        result = Integrations::NuvemFiscal::VerificarStatusCancelamento.call(relationship_id: @relationship.id)
        assert result.success?
        assert :processing, result.relationship.sender_pending?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should check cancelamento status in Nuvem Fiscal and update logs to success' do
        mock_response = file_fixture('nuvem_fiscal/consultar_cancelamento_concluido.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_cancelamento,
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
        assert @relationship.sender_pending?
        result = Integrations::NuvemFiscal::VerificarStatusCancelamento.call(relationship_id: @relationship.id)
        assert result.success?
        assert :success, result.relationship.sender_synced?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should check cancelamento status in Nuvem Fiscal and update logs to failed when erro result' do
        mock_response = file_fixture('nuvem_fiscal/consultar_cancelamento_erro.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :consultar_cancelamento,
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
        assert @relationship.sender_pending?
        result = Integrations::NuvemFiscal::VerificarStatusCancelamento.call(relationship_id: @relationship.id)
        assert result.success?
        assert :failed, result.relationship.sender_failed?
        assert 2, result.relationship.sender_logs.size
      end

      test 'should fail when relationship id is not present' do
        result = Integrations::NuvemFiscal::VerificarStatusCancelamento.call
        assert result.failure?
        assert 'Relationship id is required', result
      end

      test 'should fail when relationship not found' do
        result = Integrations::NuvemFiscal::VerificarStatusCancelamento.call(relationship_id: 0)
        assert result.failure?
        assert 'Relationship not found', result
      end
    end
  end
end
