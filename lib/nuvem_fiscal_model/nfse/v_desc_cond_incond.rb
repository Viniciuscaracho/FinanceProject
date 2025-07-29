# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "vDescIncond": 0,
    #     "vDescCond": 0
    #   }
    class VDescCondIncond < NuvemFiscalModel::Base
      attr_accessor :vDescIncond, :vDescCond
    end
  end
end
