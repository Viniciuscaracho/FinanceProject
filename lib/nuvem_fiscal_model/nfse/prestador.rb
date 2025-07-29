# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #     {
    #       "CNPJ": "string",
    #       "CPF": "string"
    #     }
    class Prestador < NuvemFiscalModel::Base
      attr_accessor :CNPJ, :CPF

      # validates presence of CNPJ or CPF (one of them must be present, not both at the same time)
      validates :CNPJ, presence: true, if: -> { self.CPF.blank? }
      validates :CPF, presence: true, if: -> { self.CNPJ.blank? }

      # CNPJ must always have 14 characters
      validates :CNPJ, length: { is: 14 }, if: -> { self.CNPJ.present? }

      # CPF must always have 11 characters
      validates :CPF, length: { is: 11 }, if: -> { self.CPF.present? }
    end
  end
end
