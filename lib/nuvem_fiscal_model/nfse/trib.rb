# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "tribMun": {}, # TribMun Object
    #     "tribFed": {}, # TribFed Object
    #     "totTrib": {}  # TotTrib Object
    #   }
    class Trib < NuvemFiscalModel::Base
      attr_accessor :tribMun, :tribFed, :totTrib

      validates :tribMun, presence: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'tribMun'
                    TribMun.new(value)
                  when 'tribFed'
                    TribFed.new(value)
                  when 'totTrib'
                    TotTrib.new(value)
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
