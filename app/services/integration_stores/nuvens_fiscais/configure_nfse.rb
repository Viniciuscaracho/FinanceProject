# frozen_string_literal: true

module IntegrationStores
  module NuvensFiscais
    # Service to update a NFSe configuration in Nuvem Fiscal
    class ConfigureNfse < ApplicationService
      def call
        return context.fail!(error: 'company is required') if context.company.blank?
        return context.fail!(error: 'company is not synced') unless context.company.nuvem_fiscal_empresa_synced?
        return context.fail!(error: 'nfse_config_params is required') if context.nfse_config_params.blank?

        context.company.nfse_config = context.company.nfse_config.presence || context.company.build_nfse_config
        context.company.nfse_config.assign_attributes(context.nfse_config_params)
        unless context.company.nfse_config.save
          return context.fail!(error: context.company.nfse_config.errors.full_messages.first)
        end

        result = Integrations::NuvemFiscal::ConfigurarServico.call(company: context.company)
        return unless result.failure?

        context.fail!(error: result.error)
      rescue IntegrationError => e
        context.fail!(error: e.message)
      end
    end
  end
end
