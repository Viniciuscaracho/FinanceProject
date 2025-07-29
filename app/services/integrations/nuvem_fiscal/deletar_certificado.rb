# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to delete a certificate in Nuvem Fiscal
    class DeletarCertificado < Dto
      protected

      def endpoint_key
        @endpoint_key ||= :deletar_certificado
      end

      def params
        @params ||= { uri: { cpf_cnpj: @company.unmasked_document_1 } }
      end

      def internal_entity
        @company.nfse_config.a1_cert_file
      end

      def payload
        @payload ||= nil
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.destroy!
        nil
      end
    end
  end
end
