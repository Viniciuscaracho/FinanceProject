# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to create a certificate in Nuvem Fiscal
    class CadastrarCertificado < Dto
      protected

      def endpoint_key
        @endpoint_key ||= :cadastrar_certificado
      end

      def params
        @params ||= { uri: { cpf_cnpj: @company.unmasked_document_1 } }
      end

      def payload
        @payload ||= NuvemFiscalModel::Certificado.new(dto)
      end

      def internal_entity
        @company.nfse_config.a1_cert_file
      end

      def dto
        # convert @company.nfse_config.a1_cert_file (has one attached file) to base64
        certificado = Base64.strict_encode64(@company.nfse_config.a1_cert_file.download)
        {
          password: @company.nfse_config.a1_cert_password,
          certificado:
        }
      end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'certificado'
        relationship.external_id = result.body[:cpf_cnpj]
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
