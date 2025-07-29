# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "cTribNac": "string",
    #     "cTribMun": "string",
    #     "CNAE": "string",
    #     "xDescServ": "string",
    #     "cNBS": "string"
    #   }
    class CServ < NuvemFiscalModel::Base
      attr_accessor :cTribNac, :cTribMun, :CNAE, :xDescServ, :cNBS

      validates :cTribNac, :xDescServ, presence: true

      validates :cTribNac, length: { maximum: 6 }
      validates :xDescServ, length: { maximum: 200 }
    end
  end
end
