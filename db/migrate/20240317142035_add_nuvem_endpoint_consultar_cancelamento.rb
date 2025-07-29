# frozen_string_literal: true

class AddNuvemEndpointConsultarCancelamento < ActiveRecord::Migration[7.0]
  def change
    nuvem = IntegrationStores::NuvemFiscal.globals.find_by!(store_type_cd: IntegrationStore::STORE_TYPES[:invoicing], name: Integrations::NuvemFiscal::NAME)
    nuvem.upsert_endpoint(:consultar_cancelamento, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}/cancelamento')
  end
end
