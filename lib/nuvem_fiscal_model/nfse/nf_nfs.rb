# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "nNFS": 9999999,
    #     "modNFS": 0,
    #     "serieNFS": "string"
    #   }
    class NfNfs < NuvemFiscalModel::Base
      attr_accessor :nNFS, :modNFS, :serieNFS

      validates :nNFS, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 9999999 }
      validates :modNFS, numericality: { only_integer: true }
      validates :serieNFS, length: { within: 1..15 }

      validates :nNFS, :modNFS, :serieNFS, presence: true
    end
  end
end
