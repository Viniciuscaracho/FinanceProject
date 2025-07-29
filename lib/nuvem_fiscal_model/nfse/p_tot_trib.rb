# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "pTotTribFed": 0,
    #     "pTotTribEst": 0,
    #     "pTotTribMun": 0
    #   }
    class PTotTrib < NuvemFiscalModel::Base
      attr_accessor :pTotTribFed, :pTotTribEst, :pTotTribMun

      validates :pTotTribFed, :pTotTribEst, :pTotTribMun, numericality: true

      validates :pTotTribFed, :pTotTribEst, :pTotTribMun, presence: true
    end
  end
end
