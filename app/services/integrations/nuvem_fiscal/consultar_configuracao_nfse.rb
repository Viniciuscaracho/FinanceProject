# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to create a company in Nuvem Fiscal
    class ConsultarConfiguracaoNfse < Dto
      protected

      def endpoint_key
        @endpoint_key = :consultar_configuracao_nfse
      end

      def internal_entity
        @company.nfse_config
      end

      def params
        @params = { uri: { cpf_cnpj: @company.unmasked_document_1 } }
      end

      def payload
        @payload ||= {}
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'configuracao_nfse'
        relationship.external_id = @company.unmasked_document_1
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
