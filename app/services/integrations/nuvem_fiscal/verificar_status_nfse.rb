# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to check nfse status in Nuvem Fiscal
    class VerificarStatusNfse < ApplicationService
      def call
        @relationship_id = context.relationship_id.presence || context.fail!(error: 'Relationship id is required')
        context.fail!(error: 'Relationship not found') if relationship.nil?
        check_status
        context.relationship = relationship.reload
      end

      private

      INVOICE_STATUS_ERRORS = %w[negada erro].freeze

      def relationship
        @relationship ||= RelationshipStore.find_by(id: @relationship_id)
      end

      def nfe_status(result)
        nfe_status = result.body[:status]
        if INVOICE_STATUS_ERRORS.include?(nfe_status)
          :failed
        elsif nfe_status == 'processando'
          :processing
        else
          :success
        end
      end

      def success_response(result)
        status = nfe_status(result)
        relationship.raw_data = result.body
        relationship.update_sender_log(response: result.body, status:, code: result.response.code.to_i)
        relationship.synced!
      end

      def validate_result(result)
        status_code = result.response.code.to_i
        if result.success? && (200..299).cover?(status_code)
          success_response(result)
        elsif result.success?
          relationship.update_sender_log(response: result.body, status: :failed, code: result.response.code.to_i)
        else
          relationship.update_sender_log(response: nil, status: :failed, error: result.error)
        end
      end

      def check_status
        result = Integrations::NuvemFiscal::Client.call(
          endpoint_key: :consultar_nfse,
          account_id: relationship.account_id,
          params: { uri: { nfse_id: relationship.external_id } }
        )
        validate_result(result)
      end
    end
  end
end
