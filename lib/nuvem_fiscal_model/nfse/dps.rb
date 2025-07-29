# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "provedor": "padrao",
    #   "ambiente": "homologacao",
    #   "referencia": "string",
    #   "infDPS": {} # InfDps Object
    # }
    class Dps < NuvemFiscalModel::Base
      attr_accessor :provedor, :ambiente, :referencia, :infDPS

      validates :provedor, :ambiente, :infDPS, :referencia, presence: true

      validates :provedor, inclusion: { in: %w[padrao nacional] }
      validates :ambiente, inclusion: { in: %w[homologacao producao] }

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'infDPS'
                    InfDps.new(value)
                  else
                    value
                  end
          send("#{name}=", value)
        end
        super
      end
    end
  end
end
