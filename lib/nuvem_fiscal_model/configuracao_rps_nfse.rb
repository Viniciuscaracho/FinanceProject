# frozen_string_literal: true

module NuvemFiscalModel
  # Represents a Nuvem Fiscal Config NFSe object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/AlterarConfigNfse
  # {
  #   "regTrib": {
  #     "opSimpNac": 1,
  #     "regApTribSN": 0,
  #     "regEspTrib": 0
  #   },
  #   "rps": {
  #     "lote": 0,
  #     "serie": "string",
  #     "numero": 0
  #   },
  #   "prefeitura": {
  #     "login": "string",
  #     "senha": "string",
  #     "token": "string"
  #   },
  #   "incentivo_fiscal": false,
  #   "ambiente": "homologacao"
  # }
  class ConfiguracaoRpsNfse < Base

    attr_accessor :rps

    validates :rps, presence: true

    def initialize(attributes = {})
      attributes.each do |name, value|
        value = case name.to_s
                when 'rps'
                  Rps.new(value)
                else
                  value
                end
        send("#{name}=", value)
      end
      super
    end
  end
end
