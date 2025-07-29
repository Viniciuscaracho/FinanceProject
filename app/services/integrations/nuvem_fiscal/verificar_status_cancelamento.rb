# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to check nfse cancel status in Nuvem Fiscal
    class VerificarStatusCancelamento < ApplicationService
      def call
        @relationship_id = context.relationship_id.presence || context.fail!(error: 'Relationship id is required')
        context.fail!(error: 'Relationship not found') if relationship.nil?
        check_status
        context.relationship = relationship.reload
      end

      private

      CANCEL_STATUS_ERRORS = %w[rejeitado erro].freeze
      CANCEL_STATUS_PENDING = %w[pendente fila_cancelamento].freeze

      def relationship
        @relationship ||= RelationshipStore.find_by(id: @relationship_id)
      end

      def cancel_status(result)
        nfe_status = result.body[:status]
        if CANCEL_STATUS_ERRORS.include?(nfe_status)
          :failed
        elsif CANCEL_STATUS_PENDING.include?(nfe_status)
          :pending
        else
          :success
        end
      end

      def success_response(result)
        status = cancel_status(result)
        relationship.raw_data = result.body
        relationship.update_sender_log(response: result.body, status:, code: result.response.code.to_i)
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
          endpoint_key: :consultar_cancelamento,
          account_id: relationship.account_id,
          params: { uri: { nfse_id: relationship.external_id } }
        )
        validate_result(result)
      end
    end
  end
end
