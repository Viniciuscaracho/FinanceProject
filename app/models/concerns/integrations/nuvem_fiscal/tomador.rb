# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    module Tomador
      extend ActiveSupport::Concern

      def nuvem_fiscal_tomador_dto
        {
          (legal? ? :CNPJ : :CPF) => unmasked_document_1,
          xNome: name,
          IM: document_3,
          fone: phone_number,
          email: email,
          end: {
            endNac: {
              cMun: address.ibge_city_code,
              CEP: address.postcode
            },
            xLgr: address.address_line1,
            nro: address.address_number,
            xBairro: address.district
          }
        }
      end

      def able_to_receive_nfse?
        document_1.present? &&
          email.present? &&
          name.present? &&
          address.present? &&
          address.address_line1.present? &&
          address.address_number.present? &&
          address.district.present? &&
          address.ibge_city_code.present? &&
          address.state.present? &&
          address.postcode.present?
      end
    end
  end
end
