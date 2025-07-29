# frozen_string_literal: true

module NuvemFiscalModel
  # Represents a Nuvem Fiscal Prefeitura object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/AlterarConfigNfse
  #   {
  #     "login": "string",
  #     "senha": "string",
  #     "token": "string"
  #   }
  class Prefeitura < Base

    attr_accessor :login, :senha, :token
  end
end
