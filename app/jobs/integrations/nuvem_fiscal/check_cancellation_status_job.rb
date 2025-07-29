# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Check the status of the invoice cancel when Nuvem Fiscal returns 'pendente'
    class CheckCancellationStatusJob < ApplicationJob
      queue_as :integrations

      retry_on InvoiceProcessingError, wait: 5.seconds, attempts: 10 do |job, exception|
        Rails.logger.error("Retries exhausted for relationship id #{job.arguments.relationship_id} due to error: #{exception.message}")
      end

      def perform(relationship_id)
        check_status(relationship_id)
      end

      private

      def check_status(relationship_id)
        result = Integrations::NuvemFiscal::VerificarStatusCancelamento.call(relationship_id:)
        raise IntegrationError, result.error if result.failure?

        continue_check(result)
      end

      def continue_check(result)
        relationship = result.relationship
        raise InvoiceProcessingError, 'Invoice cancellation still processing' if relationship.sender_pending?
      end
    end
  end
end
