# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class CadastrarCertificadoTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)

        @company_nfse_config = @account.company.build_nfse_config(
          enabled: true,
          tax_incentive: false,
          simplified_tax_system_cd: CompanyNfseConfig.simplified_tax_systems[:nao_optante],
          tax_calculation_regime_cd: CompanyNfseConfig.tax_calculation_regimes[:tributos_federais_e_municipais_pelo_sn],
          special_tax_regime_cd: CompanyNfseConfig.special_tax_regimes[:nenhum],
          rps_initial_batch_number: 1,
          rps_series: '1',
          rps_initial_number: 1,
          environment: 'homologacao',
          provider: 'padrao',
          a1_cert_password: '12345678',
          national_tax_code: '1.04',
          municipal_tax_code: '1.04',
          service_description: 'Serviços de Tecnologia',
          iss_service_provided_tax_cd: 1,
          iss_withholding_type_cd: 1,
          iss_tax_rate: 2.0
        )
        # @company_nfse_config.expects(:publish).with('company_nfse_config_enabled', record: @company_nfse_config).returns(nil)
        @company_nfse_config.save!
        @account.reload
      end

      # Use this to have an e2e test
      # test 'testing' do
      #   result = Integrations::NuvemFiscal::CadastrarCertificado.call(company: @account.company)
      #   assert result.success?
      # end

      test 'should successfully create a certificate in nuvem fiscal and create the relationship' do
        @company_nfse_config.a1_cert_file.attach(io: File.open('test/fixtures/files/nuvem_fiscal/certificado-fake.pfx'), filename: 'certificado-fake.pfx')
        base64 = Base64.strict_encode64(@company_nfse_config.a1_cert_file.download)
        mock_response = file_fixture('nuvem_fiscal/cadastrar_certificado.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Base64.expects(:strict_encode64).returns(base64)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :cadastrar_certificado,
          account_id: @account.id,
          payload: NuvemFiscalModel::Certificado.new({
                                                       password: '12345678',
                                                       certificado: base64
                                                     }).to_h,
          params: { uri: { cpf_cnpj: @account.company.document_1 } }
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              body: mock_response.as_json,
              code: 201
            )
          )
        )
        # @company_nfse_config.expects(:publish).with('company_nfse_config_a1_cert_changed', record: @company_nfse_config).returns(nil)
        result = Integrations::NuvemFiscal::CadastrarCertificado.call(company: @account.company)
        assert result.success?
        assert_equal 'certificado', result.relationship.external_entity
        assert_equal @account.company.document_1, result.relationship.external_id
        assert_not_nil result.relationship.raw_data
        assert_not_nil RelationshipStore.find_by(internal_entity: 'attachment', internal_id: @company_nfse_config.a1_cert_file.id.to_s)
      end

      test 'should fail to create a certificate in nuvem fiscal' do
        @company_nfse_config.a1_cert_file.attach(io: File.open('test/fixtures/files/nuvem_fiscal/certificado-fake.pfx'), filename: 'certificado-fake.pfx')
        base64 = Base64.strict_encode64(@company_nfse_config.a1_cert_file.download)
        Base64.expects(:strict_encode64).returns(base64)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :cadastrar_certificado,
          account_id: @account.id,
          payload: NuvemFiscalModel::Certificado.new({
                                                       password: '12345678',
                                                       certificado: base64
                                                     }).to_h,
          params: { uri: { cpf_cnpj: @account.company.document_1 } }
        ).returns(
          OpenStruct.new(
            success?: true,
            response: OpenStruct.new(
              body: { message: 'error' }.to_json,
              code: 500
            )
          )
        )
        # @company_nfse_config.expects(:publish).with('company_nfse_config_a1_cert_changed', record: @company_nfse_config).returns(nil)
        result = Integrations::NuvemFiscal::CadastrarCertificado.call(company: @account.company)
        assert result.failure?
        assert_equal @company_nfse_config.a1_cert_file.id, result.relationship.internal_id
        assert_equal 'attachment', result.relationship.internal_entity
        assert_equal 'Request failed with status code: 500', result.error
        assert_equal({ 'message' => 'error' }, result.relationship.last_sync_log[:response])
      end
    end
  end
end
