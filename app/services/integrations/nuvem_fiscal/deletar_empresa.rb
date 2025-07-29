# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to delete a company in Nuvem Fiscal
    class DeletarEmpresa < CadastrarEmpresa
      protected

      def endpoint_key
        @endpoint_key ||= :deletar_empresa
      end

      def params
        @params ||= { uri: { cpf_cnpj: @company.unmasked_document_1 } }
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
