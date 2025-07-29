# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "vServPrest": {}      # VServPrest Object,
    #   "vDescCondIncond": {} # VDescCondIncond Object,
    #   "vDedRed": {},        # VDedRed Object,
    #   "trib": {},           # Trib Object
    # }
    class Valores < NuvemFiscalModel::Base
      attr_accessor :vServPrest, :vDescCondIncond, :vDedRed, :trib

      validates :vServPrest, :trib, presence: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'vServPrest'
                    VServPrest.new(value)
                  when 'vDescCondIncond'
                    VDescCondIncond.new(value)
                  when 'vDedRed'
                    VDedRed.new(value)
                  when 'trib'
                    Trib.new(value)
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
