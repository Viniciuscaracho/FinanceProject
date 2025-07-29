# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    module Invoiceable
      extend ActiveSupport::Concern
      include Integrations::Invoiceable

      def dto
        {
          provedor: prestador.nfse_config.provider.to_s,
          ambiente: prestador.nfse_config.environment.to_s,
          referencia: referencia,
          infDPS: {
            tpAmb: prestador.nfse_config.homologacao? ? 2 : 1,
            dhEmi: data_hora_emissao,
            dCompet: data_competencia,
            prest: prestador.nuvem_fiscal_prestador_dto,
            toma: tomador.nuvem_fiscal_tomador_dto,
            serv: {
              cServ: {
                cTribNac: prestador.nfse_config.national_tax_code,
                xDescServ: descricao_servico
              }
            },
            valores: {
              vServPrest: {
                vServ: valor_servico
              },
              trib: {
                tribMun: {
                  tribISSQN: tributacao_issqn,
                  pAliq: aliquota,
                  tpRetISSQN: tipo_retencao_issqn
                }
              }
            }
          }
        }
      end

      def nuvem_fiscal_nfse
        nuvem_fiscal_relationships(external_entity: 'nfse').last
      end

      def download_nfse_pdf
        return nil unless nuvem_fiscal_nfse&.sender_synced?

        attach_nfse_pdf unless nfse_pdf.attached?
        nfse_pdf.download
      end

      def invoiced?
        nuvem_fiscal_nfse.present? && nuvem_fiscal_nfse.sender_synced?
      end

      protected

      def attach_nfse_pdf
        return unless nuvem_fiscal_nfse&.sender_synced?

        data = nuvem_fiscal_nfse&.raw_data
        return if data.blank?

        HTTParty.get(data['link_url'], stream_body: true, verify: false) do |fragment|
          nfse_pdf.attach(io: StringIO.new(fragment), filename: "nfse_#{data['numero']}.pdf", content_type: 'application/pdf')
        end

        save
      end

      def nuvem_fiscal_relationships(external_entity: nil)
        nuvem_fiscal_store.relationship_stores.where(internal_entity: self.class.table_name, internal_id: id, external_entity:)
      end

      def nuvem_fiscal_store
        IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(prestador.account.id)
      end

      def nuvem_fiscal_client(endpoint_key:, params: {})
        Integrations::NuvemFiscal::Client.call(account_id:, endpoint_key:, params:)
      end
    end
  end
end
