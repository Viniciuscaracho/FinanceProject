# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "CNPJ": "string",
    #     "CPF": "string",
    #     "NIF": "string",
    #     "cNaoNIF": 0,
    #     "CAEPF": "string",
    #     "IM": "string",
    #     "xNome": "string",
    #     "end": {}, # End Object
    #     "fone": "string",
    #     "email": "string"
    #   }
    class Fornec < NuvemFiscalModel::Base
      attr_accessor :CNPJ, :CPF, :NIF, :cNaoNIF, :CAEPF, :IM, :xNome, :end, :fone, :email

      validates :CNPJ, length: { maximum: 14 }
      validates :CPF, length: { maximum: 11 }
      validates :NIF, length: { within: 1..40 }, allow_nil: true
      validates :cNaoNIF, inclusion: { in: [0, 1, 2], message: 'is not a valid reason' }, allow_nil: true
      validates :CAEPF, length: { maximum: 14 }, allow_nil: true
      validates :IM, length: { within: 1..15 }, allow_nil: true
      validates :xNome, length: { within: 1..300 }, presence: true
      validates :email, length: { maximum: 80 }, allow_nil: true

      validate :CNPJ, presence: true, if: -> { CPF.blank? }
      validate :CPF, presence: true, if: -> { CNPJ.blank? }

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = NuvemFiscalModel::Nfse::End.new(value) if name.to_s == 'end'
          send("#{name}=", value)
        end
        super
      end
    end
  end
end
