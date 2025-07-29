# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to emit a nfse in Nuvem Fiscal
    class EmitirNfse < Dto
      def call
        @invoiceable = context.invoiceable.presence || context.fail!(error: 'Invoiceable is required')
        super
        check_invoice_status
      end

      protected

      def status_failed(last_log)
        context.relationship.update_sender_log(response: last_log[:response], status: :failed, code: last_log[:code])
        context.fail!(error: last_log[:response][:mensagens].map { |m| m[:descricao] }.join(', '))
      end

      def status_processing(last_log)
        context.relationship.update_sender_log(response: last_log[:response], status: :processing,
                                               code: last_log[:code])
        Integrations::NuvemFiscal::CheckInvoiceStatusJob.set(wait: 5.seconds).perform_later(context.relationship.id)
      end

      def check_invoice_status
        last_log = context.relationship.last_sync_log
        response = last_log[:response]
        context.status = response[:status]
        if %w[negada erro].include?(context.status)
          status_failed(last_log)
        elsif context.status == 'processando'
          status_processing(last_log)
        end
      end

      def endpoint_key
        @endpoint_key ||= :emitir_nfse
      end

      def payload
        @payload ||= NuvemFiscalModel::Nfse::Dps.new(dto)
      end

      def internal_entity
        @invoiceable
      end

      def dto
        @invoiceable.dto
      end

      # def dto
      #   # TODO: Replace with actual data coming from the request
      #   # Which entity will be required to be created in Nuvem Fiscal?
      #   {
      #     provedor: 'padrao',
      #     ambiente: 'homologacao',
      #     referencia: 'hmg20', # this should be the reference of the nfse (example: Invoice.id)
      #     infDPS: {
      #       tpAmb: 2,
      #       dhEmi: Time.current.strftime('%Y-%m-%dT%H:%M:%SZ'),
      #       dCompet: Time.current.strftime('%Y-%m-%d'),
      #       prest: {
      #         CNPJ: @company.document_1
      #       },
      #       toma: {
      #         xNome: 'A4PI SOFTWARE E SEVICOS LTDA ME',
      #         CNPJ: '21067676000172',
      #         IM: '101907',
      #         fone: '45988115410',
      #         email: 'thiagobonfante@gmail.com',
      #         end: {
      #           endNac: {
      #             cMun: '4107207',
      #             CEP: '85660000'
      #           },
      #           xLgr: 'VALERIO ZAMBONI',
      #           nro: '76',
      #           xBairro: 'VITORIA'
      #         }
      #       },
      #       serv: {
      #         cServ: {
      #           cTribNac: '1.04',
      #           xDescServ: 'Analise e desenvolvimento de software'
      #         }
      #       },
      #       valores: {
      #         vServPrest: {
      #           vServ: 100.0
      #         },
      #         trib: {
      #           tribMun: {
      #             tribISSQN: 1,
      #             pAliq: 2,
      #             tpRetISSQN: 1
      #           }
      #         }
      #       }
      #     }
      #   }
      # end

      def update_relationship(result)
        relationship = result.relationship
        relationship.external_entity = 'nfse'
        relationship.external_id = result.body[:id]
        relationship.raw_data = result.body
        relationship.synced!
      end
    end
  end
end
