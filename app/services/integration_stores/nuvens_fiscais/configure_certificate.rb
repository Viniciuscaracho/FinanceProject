# frozen_string_literal: true

module IntegrationStores
  module NuvensFiscais
    # Service to update a certificate in Nuvem Fiscal
    class ConfigureCertificate < ApplicationService
      def call
        return context.fail!(error: 'company is required') if context.company.blank?
        return context.fail!(error: 'company is not synced') unless context.company.nuvem_fiscal_empresa_synced?
        return context.fail!(error: 'certificate_params is required') if context.certificate_params.blank?

        unless context.company.nfse_config.a1_cert_file.attached?
          return context.fail!(error: 'certificate file is required')
        end

        if context.company.nfse_config.a1_cert_password.blank?
          return context.fail!(error: 'certificate password is blank')
        end

        context.nfse_config = context.company.nfse_config.presence || context.company.build_nfse_config
        context.nfse_config.assign_attributes(context.certificate_params)
        return context.fail!(error: nfse_config.errors.full_messages.first) unless nfse_config.save

        result = send_to_nuvem_fiscal
        return unless result.failure?

        context.fail!(error: result.error)
      rescue IntegrationError => e
        context.fail!(error: e.message)
      end

      private

      def send_to_nuvem_fiscal
        if context.nfse_config.nuvem_fiscal_certificado_synced?
          result = Integrations::NuvemFiscal::DeletarCertificado.call(company: context.company)
          return result unless result.failure?

          context.fail!(error: result.error)
        end

        Integrations::NuvemFiscal::CadastrarCertificado.call(company: context.company)
      end
    end
  end
end
