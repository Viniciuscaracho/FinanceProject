# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "cLocPrestacao": "string",
    #   "cPaisPrestacao": "string"
    # }
    class LocPrest < NuvemFiscalModel::Base
      attr_accessor :cLocPrestacao, :cPaisPrestacao

      validates :cLocPrestacao, :cPaisPrestacao, presence: true

      validates :cLocPrestacao, length: { is: 7 }
      validates :cPaisPrestacao, length: { is: 4 }
    end
  end
end