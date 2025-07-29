# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "vTotTribFed": 0,
    #     "vTotTribEst": 0,
    #     "vTotTribMun": 0
    #   }
    class VTotTrib < NuvemFiscalModel::Base
      attr_accessor :vTotTribFed, :vTotTribEst, :vTotTribMun

      validates :vTotTribFed, :vTotTribEst, :vTotTribMun, numericality: true

      validates :vTotTribFed, :vTotTribEst, :vTotTribMun, presence: true
    end
  end
end
