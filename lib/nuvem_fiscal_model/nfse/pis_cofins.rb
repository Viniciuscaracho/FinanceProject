# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #     "CST": "string",
    #     "vBCPisCofins": 0,
    #     "pAliqPis": 0,
    #     "pAliqCofins": 0,
    #     "vPis": 0,
    #     "vCofins": 0,
    #     "tpRetPisCofins": 0
    # }
    class PisCofins < NuvemFiscalModel::Base
      attr_accessor :CST, :vBCPisCofins, :pAliqPis, :pAliqCofins, :vPis, :vCofins, :tpRetPisCofins

      validates :CST, inclusion: { in: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'], message: 'is not a valid type' }
      validates :vBCPisCofins, :pAliqPis, :pAliqCofins, :vPis, :vCofins, numericality: true, allow_nil: true
      validates :tpRetPisCofins, inclusion: { in: [1, 2], message: 'is not a valid type' }, allow_nil: true

      validates :CST, presence: true
    end
  end
end
