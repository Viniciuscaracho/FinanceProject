# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Check the invoice status when Nuvem Fiscal returns 'processando'
    class CheckInvoiceStatusJob < ApplicationJob
      queue_as :integrations

      retry_on InvoiceProcessingError, wait: 5.seconds, attempts: :unlimited do |job, exception|
        Rails.logger.error("Retries exhausted for relationship id #{job.arguments.relationship_id} due to error: #{exception.message}")
        Rails.logger.error(exception.inspect)
      end

      def perform(relationship_id)
        check_status(relationship_id)
      end

      private

      def check_status(relationship_id)
        result = Integrations::NuvemFiscal::VerificarStatusNfse.call(relationship_id:)
        raise IntegrationError, result.error if result.failure?

        continue_check(result)
      end

      def continue_check(result)
        relationship = result.relationship
        raise InvoiceProcessingError, 'Invoice still processing' if relationship.sender_processing?
      end
    end
  end
end
