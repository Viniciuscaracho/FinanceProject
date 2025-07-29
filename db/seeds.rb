# frozen_string_literal: true

def seed_pluggy
  pluggy = IntegrationStores::Pluggy.create!(
    name: Integrations::Pluggy::NAME,
    description: 'Integração com Open Finance para facilitar as conciliações bancárias e cartão de crédito',
    store_type_cd: IntegrationStore::STORE_TYPES[:open_banking]
  )
  pluggy.settings(:config).update!(pluggy_config)
  pluggy.upsert_endpoint(:token, method: Net::HTTP::Post::METHOD, uri: '/auth')
  pluggy.upsert_endpoint(:connect_token, method: Net::HTTP::Post::METHOD, uri: '/connect_token')
  pluggy.upsert_endpoint(:connectors, method: Net::HTTP::Get::METHOD, uri: '/connectors')
  pluggy.upsert_endpoint(:accounts, method: Net::HTTP::Get::METHOD, uri: '/accounts?itemId={{item_id}}')
  pluggy.upsert_endpoint(:account, method: Net::HTTP::Get::METHOD, uri: '/accounts/{{id}}')
  pluggy.upsert_endpoint(:transactions, method: Net::HTTP::Get::METHOD, uri: '/transactions?accountId={{account_id}}')
  pluggy.upsert_endpoint(:transaction, method: Net::HTTP::Get::METHOD, uri: '/transactions/{{id}}')
  pluggy.upsert_endpoint(:categories, method: Net::HTTP::Get::METHOD, uri: '/categories')
  pluggy.upsert_endpoint(:item, { method: Net::HTTP::Get::METHOD, uri: '/items/{{item_id}}' })
end

def pluggy_config
  {
    development: pluggy_default_config,
    staging: pluggy_default_config,
    production: pluggy_default_config,
    test: pluggy_default_config
  }
end

def pluggy_default_config
  {
    api_key: nil,
    api_key_expires_at: nil,
    default_expiry: 2, # in hours
    client_id: Rails.application.credentials.dig(:pluggy, :client_id), # development id
    client_secret: Rails.application.credentials.dig(:pluggy, :client_secret), # development secret
    host: 'https://api.pluggy.ai',
    allowed_hosts: %w[127.0.0.1 localhost 177.71.238.212]
  }
end

def seed_nuvem_fiscal
  nuvem = IntegrationStores::NuvemFiscal.create!(
    name: Integrations::NuvemFiscal::NAME,
    description: 'Integração para emissão de Nota Fiscal de Serviço Eletrônica',
    store_type_cd: IntegrationStore::STORE_TYPES[:invoicing]
  )
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
  nuvem.upsert_endpoint(:consultar_cancelamento, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}/cancelamento')
  nuvem.upsert_endpoint(:baixar_pdf_nfse, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}/pdf')
  nuvem.upsert_endpoint(:sincronizar_nfse, method: Net::HTTP::Post::METHOD, uri: '/nfse/{{nfse_id}}/sincronizar')
end

def nuvem_config
  {
    test: nuvem_default_config,
    development: nuvem_default_config,
    staging: nuvem_default_config,
    production: nuvem_default_config
  }
end

def nuvem_default_config
  {
    access_token: nil,
    access_token_expires_at: nil,
    client_id: Rails.application.credentials.dig(:nuvem_fiscal, :client_id), # development id
    client_secret: Rails.application.credentials.dig(:nuvem_fiscal, :client_secret), # development secret
    host: Rails.application.credentials.dig(:nuvem_fiscal, :host),
    oauth_url: Rails.application.credentials.dig(:nuvem_fiscal, :oauth_url),
    allowed_hosts: %w[127.0.0.1 localhost dev.procfy.io],
    scopes_nfse: %w[empresa nfse]
  }
end

seed_pluggy
seed_nuvem_fiscal
