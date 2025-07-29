class AddNuvemEndpointEmitirLoteNfse < ActiveRecord::Migration[7.0]
  def up
    nuvem = IntegrationStores::NuvemFiscal.globals.find_by!(store_type_cd: IntegrationStore::STORE_TYPES[:invoicing], name: Integrations::NuvemFiscal::NAME)
    nuvem.upsert_endpoint(:emitir_lote_nfse, method: Net::HTTP::Post::METHOD, uri: '/nfse/dps/lotes')
    nuvem.upsert_endpoint(:listar_cidades_atendidas, method: Net::HTTP::Get::METHOD, uri: '/nfse/cidades')
    nuvem.upsert_endpoint(:consultar_lote_nfse, method: Net::HTTP::Get::METHOD, uri: '/nfse/lotes/{{lote_nfse_id}')
  end

  def down; end
end
