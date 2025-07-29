# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class CancelarNfseTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
      end

      # test 'testing' do
      #   result = Integrations::NuvemFiscal::CancelarNfse.call(company: @account.company, nfse_id: 'nfs_3a10f8d01d8e4ff59170a5d985e01faf')
      #   assert result.success?
      # end

      test 'should cancel nfse in Nuvem Fiscal to update logs to processing and dispatch job' do
        mock_response = file_fixture('nuvem_fiscal/cancelar_nfse.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :cancelar_nfse,
          account_id: @account.id,
          payload: mock_payload,
          params: { uri: { nfse_id: 'nfs_3a10f8d01d8e4ff59170a5d985e01faf' } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_response
            )
          )
        )
        mock_set = mock
        Integrations::NuvemFiscal::CheckCancellationStatusJob.expects(:set).with(wait: 5.seconds).returns(mock_set)
        mock_set.expects(:perform_later).returns(true)
        result = Integrations::NuvemFiscal::CancelarNfse.call(company: @account.company, nfse_id: 'nfs_3a10f8d01d8e4ff59170a5d985e01faf')
        assert result.success?
        assert 1, result.relationship.sender_logs.size
        assert result.relationship.sender_pending?
      end

      test 'should cancel nfse in Nuvem Fiscal to update logs to failed when rejeitado' do
        mock_response = file_fixture('nuvem_fiscal/cancelar_nfse_rejeitado.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :cancelar_nfse,
          account_id: @account.id,
          payload: mock_payload,
          params: { uri: { nfse_id: 'nfs_3a10f8d01d8e4ff59170a5d985e01faf' } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_response
            )
          )
        )
        result = Integrations::NuvemFiscal::CancelarNfse.call(company: @account.company, nfse_id: 'nfs_3a10f8d01d8e4ff59170a5d985e01faf')
        assert result.failure?
        assert 1, result.relationship.sender_logs.size
        assert result.relationship.sender_failed?
      end

      private

      def mock_payload
        mock = {
          codigo: '01',
          motivo: 'Test de cancelamento'
        }
        # convert all keys from mock to "string" symbols
        mock.stringify_keys
      end
    end
  end
end
