# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to create a company in Nuvem Fiscal
    class ConsultarNfse < Dto
      def call
        @invoiceable = context.invoiceable.presence || context.fail!(error: 'Invoiceable is required')
        @nfse_id = context.invoiceable.nuvem_fiscal_nfse&.external_id&.presence || context.fail!(error: 'NFS-e is required')
        super
      end

      protected

      def endpoint_key
        @endpoint_key ||= :consultar_nfse
      end

      def internal_entity
        @invoiceable
      end

      def params
        @params ||= { uri: { nfse_id: @nfse_id } }
      end

      def payload
        @payload ||= {}
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'nfse'
        relationship.external_id = result.body[:id]
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
