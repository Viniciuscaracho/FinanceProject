# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "provedor": "padrao",
    #   "ambiente": "homologacao",
    #   "referencia": "string",
    #   "documentos": [{}] # Array of DPS Object
    # }
    class DpsLote < NuvemFiscalModel::Base
      attr_accessor :provedor, :ambiente, :referencia, :documentos

      validates :provedor, :ambiente, :referencia, :documentos, presence: true
      validates :documentos, length: { minimum: 1 }

      validates :provedor, inclusion: { in: %w[padrao nacional] }
      validates :ambiente, inclusion: { in: %w[homologacao producao] }

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_sym
                  when :documentos
                    value.map! { |doc| Dps.new(doc) }
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
