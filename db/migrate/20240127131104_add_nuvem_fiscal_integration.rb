# frozen_string_literal: true

class AddNuvemFiscalIntegration < ActiveRecord::Migration[7.0]
  def up
    nuvem = IntegrationStores::NuvemFiscal.create!(name: Integrations::NuvemFiscal::NAME, store_type_cd: IntegrationStore::STORE_TYPES[:invoicing])
    nuvem.settings(:config).update!(nuvem_config)
    nuvem.upsert_endpoint(:cadastrar_empresa, method: Net::HTTP::Post::METHOD, uri: '/empresas')
    nuvem.upsert_endpoint(:buscar_empresa, method: Net::HTTP::Get::METHOD, uri: '/empresas/{{cpf_cnpj}}')
    nuvem.upsert_endpoint(:atualizar_empresa, method: Net::HTTP::Put::METHOD, uri: '/empresas/{{cpf_cnpj}}')
    nuvem.upsert_endpoint(:deletar_empresa, method: Net::HTTP::Delete::METHOD, uri: '/empresas/{{cpf_cnpj}}')
    nuvem.upsert_endpoint(:cadastrar_certificado, method: Net::HTTP::Put::METHOD, uri: '/empresas/{{cpf_cnpj}}/certificado')
    nuvem.upsert_endpoint(:upload_certificado, method: Net::HTTP::Put::METHOD, uri: '/empresas/{{cpf_cnpj}}/certificado/upload')
    nuvem.upsert_endpoint(:deletar_certificado, method: Net::HTTP::Delete::METHOD, uri: '/empresas/{{cpf_cnpj}}/certificado')
    nuvem.upsert_endpoint(:configurar_servico, method: Net::HTTP::Put::METHOD, uri: '/empresas/{{cpf_cnpj}}/nfse')
    nuvem.upsert_endpoint(:upload_logotipo, method: Net::HTTP::Put::METHOD, uri: '/empresas/{{cpf_cnpj}}/logotipo')
    nuvem.upsert_endpoint(:nfse_cidades, method: Net::HTTP::Get::METHOD, uri: '/nfse/cidades')
    nuvem.upsert_endpoint(:nfse_cidade, method: Net::HTTP::Get::METHOD, uri: '/nfse/cidades/{{codigo_ibge}}')
    nuvem.upsert_endpoint(:emitir_nfse, method: Net::HTTP::Post::METHOD, uri: '/nfse/dps')
    nuvem.upsert_endpoint(:consultar_nfse, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}')
    nuvem.upsert_endpoint(:cancelar_nfse, method: Net::HTTP::Post::METHOD, uri: '/nfse/{{nfse_id}}/cancelamento')
    nuvem.upsert_endpoint(:baixar_pdf_nfse, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}/pdf')
    nuvem.upsert_endpoint(:sincronizar_nfse, method: Net::HTTP::Post::METHOD, uri: '/nfse/{{nfse_id}}/sincronizar')
  end

  def down
    nuvem = IntegrationStore.find_by!(store_type_cd: IntegrationStore::STORE_TYPES[:invoicing], name: Integrations::NuvemFiscal::NAME)
    nuvem.destroy!
  end

  private

  def nuvem_config
    {
      test: default_config,
      development: default_config,
      staging: default_config,
      production: default_config
    }
  end

  def default_config
    {
      access_token: nil,
      access_token_expires_at: nil,
      client_id: Rails.application.credentials.dig(:nuvem_fiscal, :client_id), # development id
      client_secret: Rails.application.credentials.dig(:nuvem_fiscal, :client_secret), # development secret
      host: Rails.application.credentials.dig(:nuvem_fiscal, :host),
      oauth_url: Rails.application.credentials.dig(:nuvem_fiscal, :oauth_url),
      allowed_hosts: %w[127.0.0.1 localhost],
      scopes_nfse: 'empresa%20nfse'
    }
  end
end
