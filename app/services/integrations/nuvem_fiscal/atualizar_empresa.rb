# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to update a company in Nuvem Fiscal
    class AtualizarEmpresa < CadastrarEmpresa
      protected

      def endpoint_key
        @endpoint_key ||= :atualizar_empresa
      end

      def params
        @params ||= { uri: { cpf_cnpj: @company.unmasked_document_1 } }
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.source_last_update = Time.now
        relationship.raw_data = result.body
        relationship.save!
        relationship.reload
      end
    end
  end
end
