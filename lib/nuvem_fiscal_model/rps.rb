# frozen_string_literal: true

module NuvemFiscalModel
  # Represents a Nuvem Fiscal RPS object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/AlterarConfigNfse
  #  {
  #     "lote": 0,
  #     "serie": "string",
  #     "numero": 0
  #  }
  class Rps < Base

    attr_accessor :lote, :serie, :numero

    validates :lote, :serie, :numero, presence: true
  end
end
