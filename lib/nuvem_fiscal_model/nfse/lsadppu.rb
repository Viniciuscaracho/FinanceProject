# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "categ": 0,
    #   "objeto": 0,
    #   "extensao": "string",
    #   "nPostes": "string"
    # }
    class Lsadppu < NuvemFiscalModel::Base
      attr_accessor :categ, :objeto, :extensao, :nPostes

      validates :categ, :objeto, :extensao, :nPostes, presence: true

      validates :categ, :objeto, numericality: { only_integer: true }
      validates :extensao, length: { maximum: 5 }
      validates :nPostes, length: { maximum: 6 }
    end
  end
end