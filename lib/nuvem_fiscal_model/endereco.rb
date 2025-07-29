# frozen_string_literal: true

module NuvemFiscalModel
  # Class representing a Nuvem Fiscal Endereco object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/CriarEmpresa
  # {
  #     "logradouro": "string",
  #     "numero": "string",
  #     "complemento": "string",
  #     "bairro": "string",
  #     "codigo_municipio": "string",
  #     "cidade": "string",
  #     "uf": "string",
  #     "codigo_pais": "1058",
  #     "pais": "Brasil",
  #     "cep": "string"
  # }
  class Endereco < Base

    attr_accessor :logradouro, :numero, :complemento, :bairro, :codigo_municipio, :cidade, :uf, :codigo_pais, :pais,
                  :cep

    validates :logradouro, :numero, :bairro, :codigo_municipio, :cidade, :uf, :cep, presence: true
  end
end
