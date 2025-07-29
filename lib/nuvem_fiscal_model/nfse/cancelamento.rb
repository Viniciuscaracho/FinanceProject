# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #   {
    #     "codigo": "string",
    #     "motivo": "string"
    #   }
    class Cancelamento < NuvemFiscalModel::Base
      attr_accessor :codigo, :motivo

      validates :codigo, :motivo, presence: true
    end
  end
end