# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    module Prestador
      extend ActiveSupport::Concern

      def nuvem_fiscal_prestador_dto
        {
          CNPJ: unmasked_document_1
        }
      end

      def able_to_transmit_nfse?
        account.nfse_enabled? && nfse_config&.enabled?
      end
    end
  end
end
