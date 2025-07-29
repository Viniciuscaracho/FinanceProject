# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "cPais": "string",
    #   "cEndPost": "string",
    #   "xCidade": "string",
    #   "xEstProvReg": "string"
    # }
    class EndExt < NuvemFiscalModel::Base
      attr_accessor :cPais, :cEndPost, :xCidade, :xEstProvReg

      validates :cPais, :cEndPost, :xCidade, :xEstProvReg, presence: true
    end
  end
end
