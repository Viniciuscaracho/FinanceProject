# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class DeletarEmpresaTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @company = @account.company
        @account_store.relationship_stores.create!(
          direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound],
          internal_entity: @company.class.table_name,
          internal_id: @company.id.to_s,
          external_entity: 'empresas',
          external_id: @company.document_1,
          source_last_update: Time.now - 1.day,
          sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync],
          raw_data: nil,
          extras: {
            data_sender_log: [
              { id: 1, status: 'success' }
            ]
          }
        )
      end

      # Use this to have an e2e test
      # test 'testing' do
      #   result = Integrations::NuvemFiscal::DeletarEmpresa.call(company: @account.company.reload)
      #   assert result.success?
      # end

      test 'should successfully delete a company in nuvem fiscal and destroy the current relationship' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :deletar_empresa,
          account_id: @account.id,
          payload: nil,
          params: { uri: { cpf_cnpj: @company.document_1 } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: nil,
            response: OpenStruct.new(
              body: nil,
              code: 204
            )
          )
        )
        result = Integrations::NuvemFiscal::DeletarEmpresa.call(company: @account.company)
        assert result.success?
        assert_nil result.relationship
        assert_nil RelationshipStore.find_by(internal_entity: @company.class.table_name, internal_id: @company.id.to_s)
      end

      test 'should fail to delete a company in nuvem fiscal and not destroy the current relationship' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :deletar_empresa,
          account_id: @account.id,
          payload: nil,
          params: { uri: { cpf_cnpj: @company.document_1 } }
        ).returns(
          OpenStruct.new(
            success?: true,
            response: OpenStruct.new(
              body: { message: 'error' }.to_json,
              code: 500
            )
          )
        )
        result = Integrations::NuvemFiscal::DeletarEmpresa.call(company: @account.company)
        assert result.failure?
        assert_not_nil result.relationship
        assert_not_nil RelationshipStore.find_by(internal_entity: @company.class.table_name, internal_id: @company.id.to_s)
        assert_equal 'Request failed with status code: 500', result.error
        assert_equal({ 'message' => 'error' }, result.relationship.last_sync_log[:response])
      end
    end
  end
end
