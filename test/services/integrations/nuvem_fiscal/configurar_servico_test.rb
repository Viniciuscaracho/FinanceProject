# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class ConfigurarServicoTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @company = @account.company

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
        @company_nfse_config.save!
        @account.reload
      end

      # test 'testing' do
      #   result = Integrations::NuvemFiscal::ConfigurarServico.call(company: @account.company)
      #   assert result.success?
      # end

      test 'should successfully configure a service in nuvem fiscal and create the relationship' do
        mock_response = file_fixture('nuvem_fiscal/configurar_servico.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :configurar_servico,
          account_id: @account.id,
          payload: NuvemFiscalModel::ConfiguracaoNfse.new(dto).to_h,
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
        result = Integrations::NuvemFiscal::ConfigurarServico.call(company: @account.company)
        assert result.success?
        assert_not_nil result.relationship
        assert_equal @company_nfse_config.id, result.relationship.internal_id
        assert_equal @company_nfse_config.class.table_name, result.relationship.internal_entity
        assert_equal 'configuracao_nfse', result.relationship.external_entity
        assert_equal @account.company.document_1, result.relationship.external_id
        assert_not_nil result.relationship.raw_data
      end

      private

      def dto
        @company_nfse_config = @company.nfse_config
        {
          rps: {
            lote: @company_nfse_config.rps_initial_batch_number,
            serie: @company_nfse_config.rps_series,
            numero: @company_nfse_config.rps_initial_number
          },
          regTrib: {
            opSimpNac: @company_nfse_config.simplified_tax_system_cd,
            regApTribSN: @company_nfse_config.tax_calculation_regime_cd,
            regEspTrib: @company_nfse_config.special_tax_regime_cd
          },
          incentivo_fiscal: @company_nfse_config.tax_incentive,
          ambiente: @company_nfse_config.environment.to_s
        }
      end
    end
  end
end
