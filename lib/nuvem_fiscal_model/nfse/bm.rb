# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "tpBM": 0,
    #     "nBM": "string",
    #     "vRedBCBM": 0,
    #     "pRedBCBM": 0
    #   }
    class Bm < NuvemFiscalModel::Base
      attr_accessor :tpBM, :nBM, :vRedBCBM, :pRedBCBM

      validates :tpBM, inclusion: { in: [1, 2, 3], message: 'is not a valid type' }
      validates :vRedBCBM, :pRedBCBM, numericality: true, allow_nil: true

      validates :tpBM, :nBM, presence: true
    end
  end
end
