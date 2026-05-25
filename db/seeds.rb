# frozen_string_literal: true

# --- FUNÇÕES DE CONFIGURAÇÃO DE INTEGRAÇÕES ---

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

def pluggy_config
  {
    development: pluggy_default_config,
    staging: pluggy_default_config,
    production: pluggy_default_config,
    test: pluggy_default_config
  }
end

def seed_pluggy
  puts "\nConfigurando Pluggy..."
  pluggy = IntegrationStores::Pluggy.find_or_create_by!(name: Integrations::Pluggy::NAME) do |i|
    i.description = 'Integração com Open Finance para facilitar as conciliações bancárias e cartão de crédito'
    i.store_type_cd = IntegrationStore::STORE_TYPES[:open_banking]
  end
  
  pluggy.settings(:config).update!(pluggy_config)
  pluggy.upsert_endpoint(:token, method: Net::HTTP::Post::METHOD, uri: '/auth')
  pluggy.upsert_endpoint(:connect_token, method: Net::HTTP::Post::METHOD, uri: '/connect_token')
  pluggy.upsert_endpoint(:connectors, method: Net::HTTP::Get::METHOD, uri: '/connectors')
  pluggy.upsert_endpoint(:accounts, method: Net::HTTP::Get::METHOD, uri: '/accounts?itemId={{item_id}}')
  pluggy.upsert_endpoint(:account, method: Net::HTTP::Get::METHOD, uri: '/accounts/{{id}}')
  pluggy.upsert_endpoint(:transactions, method: Net::HTTP::Get::METHOD, uri: '/transactions?accountId={{account_id}}')
  pluggy.upsert_endpoint(:transaction, method: Net::HTTP::Get::METHOD, uri: '/transactions/{{id}}')
  pluggy.upsert_endpoint(:categories, method: Net::HTTP::Get::METHOD, uri: '/categories')
  # Sintaxe corrigida para consistência:
  pluggy.upsert_endpoint(:item, method: Net::HTTP::Get::METHOD, uri: '/items/{{item_id}}')
  puts " -> Pluggy configurado com sucesso."
end

def nuvem_default_config
  {
    access_token: nil,
    access_token_expires_at: nil,
    client_id: Rails.application.credentials.dig(:nuvem_fiscal, :client_id), # development id
    client_secret: Rails.application.credentials.dig(:nuvem_fiscal, :client_secret), # development secret
    host: Rails.application.credentials.dig(:nuvem_fiscal, :host),
    oauth_url: Rails.application.credentials.dig(:nuvem_fiscal, :oauth_url),
    allowed_hosts: %w[127.0.0.1 localhost dev.barbermanagement.io],
    scopes_nfse: %w[empresa nfse]
  }
end

def nuvem_config
  {
    test: nuvem_default_config,
    development: nuvem_default_config,
    staging: nuvem_default_config,
    production: nuvem_default_config
  }
end

def seed_nuvem_fiscal
  puts "\nConfigurando Nuvem Fiscal..."
  nuvem = IntegrationStores::NuvemFiscal.find_or_create_by!(name: Integrations::NuvemFiscal::NAME) do |i|
    i.description = 'Integração para emissão de Nota Fiscal de Serviço Eletrônica'
    i.store_type_cd = IntegrationStore::STORE_TYPES[:invoicing]
  end
  
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
  puts " -> Nuvem Fiscal configurada com sucesso."
end

# --- INÍCIO DA SEED DE DADOS CORE ---

ACCOUNT_USER_ROLES = { member: 0, admin: 1, owner: 2 }.freeze

# --- 2. MODELOS STI (SINGLE TABLE INHERITANCE) ---
# Garante que a classe Company esteja carregada para preencher a coluna 'type' da tabela 'people'.
class Company < Person; end rescue nil

puts "\nCriando dados de seed para ambiente de desenvolvimento..."

# --- 3. CRIAÇÃO DA PESSOA/EMPRESA (COMPANY) ---
company = Company.find_or_initialize_by(person_type_cd: 1)

if company.new_record?
  company.assign_attributes(
    contact_type_cd: 0,
    first_name: "Empresa Principal Exemplo",
    document_1: "00000000000000",
    document_3: "123456789", # Inscrição Municipal
    email: "empresa@exemplo.com.br"
  )
  company.save!
  puts " -> Pessoa/Empresa criada: #{company.first_name} (Type: #{company.type})"
else
  # Garantir que document_3 está preenchido (só atualizar se não tiver account ainda)
  if company.document_3.blank? && company.account.nil?
    company.update_column(:document_3, "123456789")
  end
  puts " -> Pessoa/Empresa já existe."
end

# --- 4. CRIAÇÃO DO USUÁRIO (USER) ---
user = User.find_or_create_by!(email: "admin@exemplo.com") do |u|
  u.password = "password"
  u.password_confirmation = "password"
  u.first_name = "Administrador"
  u.last_name = "Principal"
  u.skip_confirmation!
  u.accepted_terms_at = Time.current
  u.accepted_privacy_at = Time.current
end

# Garantir que os termos foram aceitos
if user.accepted_terms_at.nil? || user.accepted_privacy_at.nil?
  user.update!(
    accepted_terms_at: Time.current,
    accepted_privacy_at: Time.current
  )
end

if user.persisted? && user.previous_changes.empty?
  puts " -> Usuário já existe (Email: #{user.email})"
else
  puts " -> Usuário criado com sucesso (Email: #{user.email})"
end

# --- 5. CRIAÇÃO DA CONTA (ACCOUNT) ---
account = Account.find_or_create_by!(company: company) do |a|
  a.owner = user
  a.admin = true
  a.account_type_cd = 0
end

# Garantir que o owner está definido
if account.owner != user
  account.update!(owner: user)
end

if account.persisted? && account.previous_changes.empty?
  puts " -> Conta já existe (ID: #{account.id})"
else
  puts " -> Conta criada com sucesso (ID: #{account.id})"
end


# --- 7. CRIAÇÃO DA ASSOCIAÇÃO ACCOUNT_USER ---
account_user = AccountUser.find_or_initialize_by(account: account, user: user)

if account_user.new_record? || account_user.role_cd != ACCOUNT_USER_ROLES[:owner]
  account_user.role_cd = ACCOUNT_USER_ROLES[:owner] 
  account_user.save!
  puts " -> Associação AccountUser criada/atualizada como OWNER."
else
  puts " -> Associação AccountUser já existe como OWNER."
end

puts "\nSeed de dados core concluída!"

# --- INÍCIO DA SEED DE INTEGRAÇÕES ---
seed_pluggy
seed_nuvem_fiscal

# --- SEED DE DADOS DE DEMONSTRAÇÃO (OPCIONAL) ---
# Descomente a linha abaixo para criar dados de exemplo
# load Rails.root.join('db', 'seeds', 'demo_data.rb')

# --- SEED DE DADOS DE AGENDAMENTOS ---
# Carrega dados de profissionais, serviços, contatos e agendamentos
load Rails.root.join('db', 'seeds', 'appointments_data.rb')

# --- SEED DE DADOS EXPANDIDOS DE AGENDAMENTOS ---
# Carrega dados expandidos com mais profissionais e agendamentos no mesmo dia
load Rails.root.join('db', 'seeds', 'appointments_expanded_data.rb')

# --- SEED TABELA TACO (alimentos) ---
load Rails.root.join('db', 'seeds', 'taco_foods.rb')

# --- SEED PLANOS ALIMENTARES (nutri MVP) ---
load Rails.root.join('db', 'seeds', 'meal_plans_data.rb')

# --- SEED TEMPLATES DE PLANO ALIMENTAR ---
load Rails.root.join('db', 'seeds', 'meal_plan_templates.rb')