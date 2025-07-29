# frozen_string_literal: true

module NuvemFiscalModel
  # Represents a Nuvem Fiscal Certificado object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/CadastrarCertificadoEmpresa
  # {
  #   "certificado": "string", (base64 encoded)
  #   "password": "string"
  # }
  class Certificado < Base
    attr_accessor :certificado, :password

    validates :certificado, :password, presence: true
  end
end
