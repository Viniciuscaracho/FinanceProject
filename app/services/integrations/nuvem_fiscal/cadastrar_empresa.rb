# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to create a company in Nuvem Fiscal
    class CadastrarEmpresa < Dto
      protected

      def endpoint_key
        @endpoint_key ||= :cadastrar_empresa
      end

      def internal_entity
        @company
      end

      def payload
        @payload ||= NuvemFiscalModel::Empresa.new(dto)
      end

      def dto
        {
          cpf_cnpj: @company.unmasked_document_1,
          nome_razao_social: @company.screen_name,
          nome_fantasia: @company.name,
          inscricao_municipal: @company.document_3,
          fone: @company.phone_number,
          email: @company.email,
          endereco: {
            logradouro: @company.address.address_line1,
            numero: @company.address.address_number,
            complemento: @company.address.address_line2,
            bairro: @company.address.district,
            cep: @company.address.postcode,
            cidade: @company.address.city,
            uf: @company.address.state,
            pais: @company.address.country,
            codigo_pais: '1058',
            codigo_municipio: @company.address.ibge_city_code
          }
        }
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'empresas'
        relationship.external_id = result.body[:cpf_cnpj]
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
