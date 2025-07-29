# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "cMun": "string",
    #     "CEP": "string"
    #   }
    class EndNac < NuvemFiscalModel::Base
      attr_accessor :cMun, :CEP

      validates :cMun, :CEP, presence: true

      validates :cMun, length: { is: 7 }, if: -> { cMun.present? }
      validates :CEP, length: { is: 8 }, if: -> { self.CEP.present? }
    end
  end
end
