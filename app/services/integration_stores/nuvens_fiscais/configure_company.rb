# frozen_string_literal: true

module IntegrationStores
  module NuvensFiscais
    # Service to update a company in Nuvem Fiscal
    class ConfigureCompany < ApplicationService
      def call
        return context.fail!(error: 'Company is required') if context.company.blank?

        context.company.assign_attributes(context.company_params)
        return context.fail!(error: context.company.errors.full_messages.first) unless context.company.save

        result = send_to_nuvem_fiscal
        return if result.success?

        context.fail!(error: result.error)
      rescue IntegrationError => e
        context.fail!(error: e.message)
      end

      private

      def send_to_nuvem_fiscal
        if context.company.nuvem_fiscal_empresa_synced?
          Integrations::NuvemFiscal::AtualizarEmpresa.call(company: context.company)
        else
          Integrations::NuvemFiscal::CadastrarEmpresa.call(company: context.company)
        end
      end
    end
  end
end
