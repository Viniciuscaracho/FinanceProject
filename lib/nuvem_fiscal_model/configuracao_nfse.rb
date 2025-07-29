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
  class ConfiguracaoNfse < Base

    attr_accessor :regTrib, :rps, :prefeitura, :incentivo_fiscal, :ambiente

    validates :rps, :ambiente, presence: true

    # ambient can only be 'homologacao' or 'producao'
    validates :ambiente, inclusion: { in: %w[homologacao producao] }

    def initialize(attributes = {})
      attributes.each do |name, value|
        value = case name.to_s
                when 'regTrib'
                  RegimeTributario.new(value)
                when 'rps'
                  Rps.new(value)
                when 'prefeitura'
                  Prefeitura.new(value)
                else
                  value
                end
        send("#{name}=", value)
      end
      super
    end
  end
end
