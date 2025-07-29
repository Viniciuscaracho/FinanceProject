# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "piscofins": {}, # Piscofins Object
    #   "vRetCP": 0,
    #   "vRetIRRF": 0,
    #   "vRetCSLL": 0
    # }
    class TribFed < NuvemFiscalModel::Base
      attr_accessor :vRetCP, :vRetIRRF, :vRetCSLL, :piscofins

      validates :vRetCP, :vRetIRRF, :vRetCSLL, numericality: true, allow_nil: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'piscofins'
                    PisCofins.new(value)
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