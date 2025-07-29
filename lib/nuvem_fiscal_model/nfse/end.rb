# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "endNac": {}, # EndNac Object,
    #   "endExt": {}, # EndExt Object
    #   "xLgr": "string",
    #   "nro": "string",
    #   "xCpl": "string",
    #   "xBairro": "string"
    # }
    class End < NuvemFiscalModel::Base
      attr_accessor :endNac, :endExt, :xLgr, :nro, :xCpl, :xBairro

      validates :xLgr, :nro, :xBairro, presence: true

      validates :xLgr, length: { maximum: 255 }
      validates :nro, length: { maximum: 60 }
      validates :xCpl, length: { maximum: 156 }
      validates :xBairro, length: { maximum: 60 }

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'endNac'
                    EndNac.new(value)
                  when 'endExt'
                    EndExt.new(value)
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