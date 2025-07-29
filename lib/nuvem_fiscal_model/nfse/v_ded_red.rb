# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "pDR": 0,
    #     "vDR": 0,
    #     "documentos": {}, # Documentos Object
    #   }
    class VDedRed < NuvemFiscalModel::Base
      attr_accessor :pDR, :vDR, :documentos

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = NuvemFiscalModel::Nfse::Documentos.new(value) if name.to_s == 'documentos'
          send("#{name}=", value)
        end
        super
      end
    end
  end
end