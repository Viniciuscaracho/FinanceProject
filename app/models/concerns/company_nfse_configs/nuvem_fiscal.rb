# frozen_string_literal: true

module CompanyNfseConfigs
  # Pluggy helper class for account
  module NuvemFiscal
    extend ActiveSupport::Concern

    def nuvem_fiscal_configuracao_nfse
      nuvem_fiscal_relationships(external_entity: 'configuracao_nfse').last
    end

    def nuvem_fiscal_configuracao_nfse_synced?
      nuvem_fiscal_configuracao_nfse&.sender_synced?
    end

    def nuvem_fiscal_certificado
      nuvem_fiscal_relationships(external_entity: 'certificado').last
    end

    def nuvem_fiscal_certificado_synced?
      nuvem_fiscal_certificado&.sender_synced?
    end

    def sync_rps_numbering
      result = Integrations::NuvemFiscal::ConsultarConfiguracaoNfse.call(company:)
      raise IntegrationError, result.error if result.failure?

      data = result.relationship.raw_data
      update_columns(
        rps_initial_batch_number: (data[:rps][:lote]),
        rps_initial_number: (data[:rps][:numero]),
        rps_series: data[:rps][:serie]
      )
    end

    protected

    def nuvem_fiscal_relationships(external_entity: nil)
      nuvem_fiscal_store.relationship_stores.where(external_entity:)
    end

    def nuvem_fiscal_store
      IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(company.account.id)
    end
  end
end
