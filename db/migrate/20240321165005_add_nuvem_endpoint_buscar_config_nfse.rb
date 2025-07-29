class AddNuvemEndpointBuscarConfigNfse < ActiveRecord::Migration[7.0]
  def change
    nuvem = IntegrationStores::NuvemFiscal.globals.find_by!(store_type_cd: IntegrationStore::STORE_TYPES[:invoicing], name: Integrations::NuvemFiscal::NAME)
    nuvem.upsert_endpoint(:consultar_configuracao_nfse, method: Net::HTTP::Get::METHOD, uri: '/empresas/{{cpf_cnpj}}/nfse')
  end
end
