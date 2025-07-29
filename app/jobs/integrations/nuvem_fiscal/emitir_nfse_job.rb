# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Check the invoice status when Nuvem Fiscal returns 'processando'
    class EmitirNfseJob < ApplicationJob
      queue_as :integrations

      retry_on IntegrationError, wait: :exponentially_longer, attempts: :unlimited do |job, exception|
        Rails.logger.error("Retries exhausted for company: #{job.arguments.company.inspect}, invoiceable: #{job.arguments.invoiceable.inspect} due to error: #{exception.message}")
        Rails.logger.error(exception.inspect)
      end

      def perform(company, invoiceable)
        result = Integrations::NuvemFiscal::EmitirNfse.call(company:, invoiceable:)
        raise IntegrationError, result.error if result.failure?
      end
    end
  end
end
