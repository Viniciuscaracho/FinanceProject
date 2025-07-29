# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "cMunNFSeMun": "string",
    #     "nNFSeMun": 0,
    #     "cVerifNFSeMun": "string"
    #   },
    class NfseMun < NuvemFiscalModel::Base
      attr_accessor :cMunNFSeMun, :nNFSeMun, :cVerifNFSeMun

      validates :cMunNFSeMun, :nNFSeMun, :cVerifNFSeMun, presence: true
      validates :cVerifNFSeMun, length: { within: 1..9 }, allow_nil: true
    end
  end
end
