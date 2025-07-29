# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "chNFSe": "string",
    #   "chNFe": "string",
    #   "NFSeMun": {}, # NfseMun Object
    #   "NFNFS": {},   # NfNfs Object
    #   "nDocFisc": "string",
    #   "nDoc": "string",
    #   "tpDedRed": 0,
    #   "xDescOutDed": "string",
    #   "dtEmiDoc": "2019-08-24",
    #   "vDedutivelRedutivel": 0,
    #   "vDeducaoReducao": 0,
    #   "fornec": {}   # Fornec Object
    # }
    class DocDedRed < NuvemFiscalModel::Base
      attr_accessor :chNFSe, :chNFe, :NFSeMun, :NFNFS, :nDocFisc, :nDoc, :tpDedRed, :xDescOutDed, :dtEmiDoc,
                    :vDedutivelRedutivel, :vDeducaoReducao, :fornec

      validates :chNFSe, length: { maximum: 50 }, allow_nil: true
      validates :chNFe, length: { maximum: 44 }, allow_nil: true
      validates :nDocFisc, length: { within: 1..255 }, allow_nil: true
      validates :nDoc, length: { within: 1..255 }, allow_nil: true
      validates :tpDedRed, inclusion: { in: [1, 2, 3, 4, 5, 6, 7, 8, 99], message: 'is not a valid type' }
      validates :xDescOutDed, length: { within: 1..150 }, allow_nil: true
      validates :dtEmiDoc, format: { with: /\A\d{4}-\d{2}-\d{2}\z/, message: 'must be in the format YYYY-MM-DD' }
      validates :vDedutivelRedutivel, numericality: true
      validates :vDeducaoReducao, numericality: { less_than_or_equal_to: :vDedutivelRedutivel }

      validates :tpDedRed, :dtEmiDoc, :vDedutivelRedutivel, :vDeducaoReducao, presence: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = NuvemFiscalModel::Nfse::NfseMun.new(value) if name.to_s == 'NFSeMun'
          value = NuvemFiscalModel::Nfse::NfNfs.new(value) if name.to_s == 'NFNFS'
          value = NuvemFiscalModel::Nfse::Fornec.new(value) if name.to_s == 'fornec'
          send("#{name}=", value)
        end
        super
      end
    end
  end
end
