# frozen_string_literal: true

module NuvemFiscalModel
  # Class representing a Nuvem Fiscal Empresa object
  # https://dev.nuvemfiscal.com.br/docs/api#tag/Empresa/operation/CriarEmpresa
  # {
  #   "cpf_cnpj": "string",
  #   "created_at": "2019-08-24T14:15:22Z",
  #   "updated_at": "2019-08-24T14:15:22Z",
  #   "inscricao_estadual": "string",
  #   "inscricao_municipal": "string",
  #   "nome_razao_social": "string",
  #   "nome_fantasia": "string",
  #   "fone": "string",
  #   "email": "string",
  #   "endereco": Endereco
  # }
  class Empresa < Base
    attr_accessor :cpf_cnpj, :inscricao_estadual, :inscricao_municipal, :nome_razao_social, :nome_fantasia, :fone,
                  :email, :created_at, :updated_at, :endereco

    validates :cpf_cnpj, :nome_razao_social, :email, :endereco, presence: true

    def initialize(attributes = {})
      attributes.each do |name, value|
        value = Endereco.new(value) if name.to_s == 'endereco'
        send("#{name}=", value)
      end
      super
    end
  end
end
