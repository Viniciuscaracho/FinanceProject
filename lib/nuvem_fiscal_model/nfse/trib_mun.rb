# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "tribISSQN": 0,
    #   "cLocIncid": "string",
    #   "cPaisResult": "string",
    #   "BM": {},       # Bm Object
    #   "exigSusp": {}, # ExigSusp Object
    #   "tpImunidade": 0,
    #   "vBC": 0,
    #   "pAliq": 0,
    #   "vISSQN": 0,
    #   "tpRetISSQN": 1,
    #   "vLiq": 0
    # }
    class TribMun < NuvemFiscalModel::Base
      attr_accessor :tribISSQN, :cLocIncid, :cPaisResult, :BM, :exigSusp, :tpImunidade, :vBC, :pAliq, :vISSQN, :tpRetISSQN, :vLiq

      validates :tribISSQN, inclusion: { in: [1, 2, 3, 4], message: 'is not a valid type' }
      validates :tpImunidade, inclusion: { in: [0, 1, 2, 3, 4], message: 'is not a valid type' }, allow_nil: true
      validates :tpRetISSQN, inclusion: { in: [1, 2, 3], message: 'is not a valid type' }, allow_nil: true
      validates :vBC, :pAliq, :vISSQN, :vLiq, numericality: true, allow_nil: true

      validates :tribISSQN, presence: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'BM'
                    Bm.new(value)
                  when 'exigSusp'
                    ExigSusp.new(value)
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