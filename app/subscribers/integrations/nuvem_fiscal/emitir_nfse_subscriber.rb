# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    class EmitirNfseSubscriber < ApplicationSubscriber
      on_publish :subscription_invoice_paid

      def on_subscription_invoice_paid(event)
        subscription_invoice = event.payload.fetch(:record)
        return unless subscription_invoice.able_to_send_nfse?

        account = Account.barber_management_account
        return unless account.nfse_enabled?

        company = account.company
        return unless company.nfse_config.enabled?

        Integrations::NuvemFiscal::EmitirNfseJob.perform_later(company, subscription_invoice)
      end
    end
  end
end
