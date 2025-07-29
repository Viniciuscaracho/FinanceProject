# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "idDocTec": "string",
    #   "docRef": "string",
    #   "xInfComp": "string"
    # }
    class InfoCompl < NuvemFiscalModel::Base
      attr_accessor :idDocTec, :docRef, :xInfComp

      validates :iDocTec, length: { maximum: 40 }
      validates :docRef, length: { maximum: 255 }
      validates :xInfComp, length: { maximum: 2000 }
    end
  end
end
