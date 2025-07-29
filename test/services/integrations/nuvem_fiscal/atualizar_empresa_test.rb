# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class AtualizarEmpresaTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @company = @account.company
        @relationship = @account_store.relationship_stores.create!(
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
      #   @account.company.update!(first_name: 'Teste')
      #   result = Integrations::NuvemFiscal::AtualizarEmpresa.call(company: @account.company.reload)
      #   assert result.success?
      # end

      test 'should successfully update a company in nuvem fiscal and update the current relationship' do
        # the response is the same as the cadastrar_empresa.json
        mock_response = file_fixture('nuvem_fiscal/cadastrar_empresa.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :atualizar_empresa,
          account_id: @account.id,
          payload: NuvemFiscalModel::Empresa.new(dto).to_h,
          params: { uri: { cpf_cnpj: @company.document_1 } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              body: mock_response,
              code: 200
            )
          )
        )
        result = Integrations::NuvemFiscal::AtualizarEmpresa.call(company: @account.company)
        assert result.success?
        assert_equal 'empresas', result.relationship.external_entity
        assert_equal @account.company.document_1, result.relationship.external_id
        assert_not_nil result.relationship.raw_data
        assert 2, result.relationship.last_sync_log[:id]
        assert_equal @relationship.id, result.relationship.id
        assert @relationship.source_last_update < result.relationship.source_last_update
      end

      test 'should fail to update a company in nuvem fiscal' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :atualizar_empresa,
          account_id: @account.id,
          payload: NuvemFiscalModel::Empresa.new(dto).to_h,
          params: { uri: { cpf_cnpj: @company.document_1 } }
        ).returns(
          OpenStruct.new(
            success?: true,
            failure?: false,
            response: OpenStruct.new(
              body: { message: 'error' }.to_json,
              code: 500
            )
          )
        )
        result = Integrations::NuvemFiscal::AtualizarEmpresa.call(company: @account.company)
        assert result.failure?
        assert_equal 'Request failed with status code: 500', result.error
        assert_equal({ 'message' => 'error' }, result.relationship.last_sync_log[:response])
        assert result.relationship.sender_failed?
        assert_nil result.relationship.raw_data
        assert 1, result.relationship.last_sync_log[:id]
        assert_equal @relationship.id, result.relationship.id

      end

      private

      def dto
        {
          cpf_cnpj: @company.document_1,
          nome_razao_social: @company.screen_name,
          nome_fantasia: @company.name,
          inscricao_municipal: @company.document_3,
          fone: @company.phone_number,
          email: @company.email,
          endereco: {
            logradouro: @company.address.address_line1,
            numero: @company.address.address_number,
            complemento: @company.address.address_line2,
            bairro: @company.address.district,
            cep: @company.address.postcode,
            cidade: @company.address.city,
            uf: @company.address.state,
            pais: @company.address.country,
            codigo_pais: '1058',
            codigo_municipio: @company.address.ibge_city_code
          }
        }
      end
    end
  end
end
