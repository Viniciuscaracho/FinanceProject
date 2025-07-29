# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to create a company in Nuvem Fiscal
    class ConsultarEmpresa < Dto
      protected

      def endpoint_key
        @endpoint_key ||= :buscar_empresa
      end

      def internal_entity
        @company
      end

      def params
        @params ||= { uri: { cpf_cnpj: @company.unmasked_document_1 } }
      end

      def payload
        @payload ||= {}
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'empresas'
        relationship.external_id = @company.unmasked_document_1
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
