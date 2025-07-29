# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to send data to Nuvem Fiscal
    class DataSender < Integrations::DataSenderBase
      protected

      def send_request
        Integrations::NuvemFiscal::Client.call(
          endpoint_key: @endpoint_key,
          account_id: @account_id,
          payload: @payload,
          params: @params
        )
      end

      def integration_store
        @integration_store ||= IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account_id)
      end
    end
  end
end
