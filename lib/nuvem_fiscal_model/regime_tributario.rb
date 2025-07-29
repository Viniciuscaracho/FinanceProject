# frozen_string_literal: true

module NuvemFiscalModel
  # Represents a Nuvem Fiscal Regime Tributario object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/AlterarConfigNfse
  #   {
  #     "opSimpNac": 1,
  #     "regApTribSN": 0,
  #     "regEspTrib": 0
  #   }
  class RegimeTributario < Base

    attr_accessor :opSimpNac, :regApTribSN, :regEspTrib
  end
end
