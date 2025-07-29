# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to configure the nfse data in Nuvem Fiscal
    class ConfigurarServico < Dto
      protected

      def endpoint_key
        @endpoint_key ||= :configurar_servico
      end

      def params
        @params ||= { uri: { cpf_cnpj: @company.unmasked_document_1 } }
      end

      def internal_entity
        @company.nfse_config
      end

      def payload
        @payload ||= NuvemFiscalModel::ConfiguracaoNfse.new(dto)
      end

      def dto
        company_nfse_config = @company.nfse_config
        {
          rps: {
            lote: company_nfse_config.rps_initial_batch_number,
            serie: company_nfse_config.rps_series,
            numero: company_nfse_config.rps_initial_number
          },
          regTrib: {
            opSimpNac: company_nfse_config.simplified_tax_system_cd,
            regApTribSN: company_nfse_config.tax_calculation_regime_cd,
            regEspTrib: company_nfse_config.special_tax_regime_cd
          },
          incentivo_fiscal: company_nfse_config.tax_incentive,
          ambiente: company_nfse_config.environment.to_s
        }
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'configuracao_nfse'
        relationship.external_id = @company.unmasked_document_1
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
