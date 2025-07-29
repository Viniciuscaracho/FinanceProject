# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #     {
    #       "CNPJ": "string",
    #       "CPF": "string",
    #       "NIF": "string",
    #       "cNaoNIF": 0,
    #       "CAEPF": "string",
    #       "IM": "string",
    #       "xNome": "string",
    #       "end": {}, # End Object
    #       "fone": "string",
    #       "email": "string"
    #     }
    class Tomador < NuvemFiscalModel::Base
      attr_accessor :CNPJ, :CPF, :NIF, :cNaoNIF, :CAEPF, :IM, :xNome, :end, :fone, :email

      # validates presence of CNPJ or CPF (one of them must be present, not both at the same time)
      validates :CNPJ, presence: true, if: -> { self.CPF.blank? }
      validates :CPF, presence: true, if: -> { self.CNPJ.blank? }

      # CNPJ must always have 14 characters
      validates :CNPJ, length: { is: 14 }, if: -> { self.CNPJ.present? }

      # CPF must always have 11 characters
      validates :CPF, length: { is: 11 }, if: -> { self.CPF.present? }

      validates :xNome, :end, presence: true, length: { maximum: 300 }
      validates :email, length: { maximum: 80 }

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = End.new(value) if name.to_s == 'end'
          send("#{name}=", value)
        end
        super
      end
    end
  end
end
