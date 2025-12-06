# frozen_string_literal: true

module Integrations
  module NuvemFiscal
    # Service to create a company in Nuvem Fiscal
    class SyncCidadesAtendidas < ApplicationService
      def call
        result = Integrations::NuvemFiscal::Client.call(
          endpoint_key: :listar_cidades_atendidas,
          account_id: Account.barber_management_account.id,
          payload: {},
          params: {}
        )
        return context.fail!(error: result.error) if result.failure?

        result.body[:data].each do |key|
          City.find_by(key:).update(metadata: { able_to_emit_nfse: true })
        end

        context.cities = Enums::Cities::ListNfse.call.cities
      end
    end
  end
end
