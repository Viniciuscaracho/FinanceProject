# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class CadastrarEmpresaTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @company = @account.company
      end

      # Use this to have an e2e test
      # test 'testing' do
      #   result = Integrations::NuvemFiscal::CadastrarEmpresa.call(company: @account.company)
      #   assert result.success?
      # end

      test 'should successfully create a company in nuvem fiscal' do
        mock_response = file_fixture('nuvem_fiscal/cadastrar_empresa.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :cadastrar_empresa,
          account_id: @account.id,
          payload: NuvemFiscalModel::Empresa.new(dto).to_h,
          params: {}
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
        result = Integrations::NuvemFiscal::CadastrarEmpresa.call(company: @account.company)
        assert result.success?
        assert_equal 'empresas', result.relationship.external_entity
        assert_equal @account.company.document_1, result.relationship.external_id
        assert result.relationship.sender_synced?
      end

      test 'should fail to create a company in nuvem fiscal' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :cadastrar_empresa,
          account_id: @account.id,
          payload: NuvemFiscalModel::Empresa.new(dto).to_h,
          params: {}
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
        result = Integrations::NuvemFiscal::CadastrarEmpresa.call(company: @account.company)
        assert result.failure?
        assert_equal 'Request failed with status code: 500', result.error
        assert_equal({ 'message' => 'error' }, result.relationship.last_sync_log[:response])
        assert result.relationship.sender_failed?
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
