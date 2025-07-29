# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class DeletarCertificadoTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)

        @company_nfse_config = @account.company.create_nfse_config(
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
        @company_nfse_config.a1_cert_file.attach(io: File.open('test/fixtures/files/nuvem_fiscal/certificado-fake.pfx'),
                                                 filename: 'certificado.pfx')
        @company_nfse_config.save!
        relationship = @account_store.relationship_stores.create!(
          account_id: @account.id,
          external_entity: 'certificado',
          external_id: '21067676000172',
          internal_entity: 'attachment',
          internal_id: @company_nfse_config.a1_cert_file.id.to_s,
          direction_cd: RelationshipStore::DIRECTION_TYPES[:outbound],
          sync_type_cd: RelationshipStore::SYNC_TYPES[:auto_sync]
        )
        relationship.add_sender_log(endpoint_key: :cadastrar_certificado,
                                    params: { uri: { cpf_cnpj: @account.company.document_1 } },
                                    payload: { password: '', certificado: '' })
        @account.reload
      end

      # Use this to have an e2e test
      # test 'testing' do
      #   result = Integrations::NuvemFiscal::DeletarCertificado.call(company: @account.company)
      #   assert result.success?
      # end

      test 'should successfully delete a certificate in nuvem fiscal and destroy the current relationship' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :deletar_certificado,
          account_id: @account.id,
          payload: nil,
          params: { uri: { cpf_cnpj: @account.company.document_1 } }
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
        result = Integrations::NuvemFiscal::DeletarCertificado.call(company: @account.company)
        assert result.success?
        assert_nil RelationshipStore.find_by(internal_entity: 'attachment',
                                             internal_id: @company_nfse_config.a1_cert_file.id.to_s)
      end

      test 'should fail to delete a certificate in nuvem fiscal and not destroy the current relationship' do
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :deletar_certificado,
          account_id: @account.id,
          payload: nil,
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
        result = Integrations::NuvemFiscal::DeletarCertificado.call(company: @account.company)
        assert result.failure?
        assert_not_nil RelationshipStore.find_by(internal_entity: 'attachment',
                                                 internal_id: @company_nfse_config.a1_cert_file.id.to_s)
        assert_equal 'Request failed with status code: 500', result.error
        assert_equal({ 'message' => 'error' }, result.relationship.last_sync_log[:response])
        assert_equal 2, result.relationship.last_sync_log[:id]
      end
    end
  end
end
