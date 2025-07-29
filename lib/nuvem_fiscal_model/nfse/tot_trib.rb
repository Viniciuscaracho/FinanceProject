# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "vTotTrib": {}, # VTotTrib Object
    #   "pTotTrib": {}, # PTotTrib Object
    #   "indTotTrib": 0,
    #   "pTotTribSN": 0
    # }
    class TotTrib < NuvemFiscalModel::Base
      attr_accessor :vTotTrib, :pTotTrib, :indTotTrib, :pTotTribSN

      validate :pTotTribSN, numericality: true, allow_nil: true
      validates :indTotTrib, inclusion: { is: 0, message: 'is not a valid type' }, allow_nil: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'vTotTrib'
                    VTotTrib.new(value)
                  when 'pTotTrib'
                    PTotTrib.new(value)
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
