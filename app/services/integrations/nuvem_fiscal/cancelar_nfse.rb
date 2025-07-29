# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to cancel a nfse in Nuvem Fiscal
    class CancelarNfse < Dto
      def call
        @nfse_id = context.nfse_id.presence || context.fail!(error: 'Nfse id is required')
        super
        check_cancel_status
      end

      protected

      def status_failed(last_log)
        context.relationship.update_sender_log(response: last_log[:response], status: :failed, code: last_log[:code])
        context.fail!(error: last_log[:response][:mensagens].map { |m| m[:descricao] }.join(', '))
      end

      def status_pending(last_log)
        context.relationship.update_sender_log(response: last_log[:response], status: :pending,
                                               code: last_log[:code])
        Integrations::NuvemFiscal::CheckCancellationStatusJob.set(wait: 5.seconds).perform_later(context.relationship.id)
      end

      def check_cancel_status
        last_log = context.relationship.last_sync_log
        response = last_log[:response]
        context.status = response[:status]
        if %w[rejeitado erro].include?(context.status)
          status_failed(last_log)
        elsif %w[pendente fila_cancelamento].include?(context.status)
          status_pending(last_log)
        end
      end

      def endpoint_key
        @endpoint_key ||= :cancelar_nfse
      end

      def payload
        @payload ||= NuvemFiscalModel::Nfse::Cancelamento.new(dto)
      end

      def params
        @params ||= { uri: { nfse_id: @nfse_id }}
      end

      # TODO: Probably invoice? but I don't know what is the internal entity here
      def internal_entity
        @company
      end

      def dto
        # TODO: Replace with actual data coming from the request
        # Which entity will be required to be created in Nuvem Fiscal?
        {
          codigo: '01',
          motivo: 'Test de cancelamento'
        }
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'nfse_cancelamento'
        relationship.external_id = result.body[:id]
        relationship.synced!
      end
    end
  end
end
