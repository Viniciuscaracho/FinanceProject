# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "tpSusp": 0,
    #     "nProcesso": "string"
    #   }
    class ExigSusp < NuvemFiscalModel::Base
      attr_accessor :tpSusp, :nProcesso

      validates :tpSusp, inclusion: { in: [1, 2], message: 'is not a valid type' }

      validates :tpSusp, :nProcesso, presence: true
    end
  end
end
