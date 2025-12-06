# frozen_string_literal: true

namespace :auth do
  desc 'Test authentication with created user'
  task test_login: :environment do
    puts "Testing authentication..."
    
    # Buscar o usuário criado
    user = User.find_by(email: 'admin@barbermanagement.io')
    
    if user.nil?
      puts "❌ User not found!"
      return
    end
    
    puts "✅ User found:"
    puts "  ID: #{user.id}"
    puts "  Email: #{user.email}"
    puts "  Confirmed: #{user.confirmed_at.present?}"
    puts "  Account: #{user.account&.name || 'No account'}"
    puts "  Account ID: #{user.account&.id}"
    puts "  Account Users: #{user.account_users.count}"
    
    # Testar se o usuário pode fazer login
    if user.valid_password?('password123')
      puts "✅ Password is valid"
    else
      puts "❌ Password is invalid"
    end
    
    # Verificar se há problemas com a conta
    if user.account.nil?
      puts "❌ User has no account!"
    else
      puts "✅ User has account: #{user.account.name}"
      
      # Verificar account_users
      account_user = user.account_users.first
      if account_user
        puts "✅ AccountUser found:"
        puts "  Role: #{account_user.role}"
        puts "  Policies: #{account_user.policies.count}"
      else
        puts "❌ No AccountUser found!"
      end
    end
    
    # Verificar se há problemas com confirmação
    if user.confirmed_at.nil?
      puts "❌ User is not confirmed!"
      puts "  Confirming user..."
      user.update!(confirmed_at: Time.current)
      puts "✅ User confirmed!"
    else
      puts "✅ User is confirmed"
    end
    
    # Verificar se há problemas com termos aceitos
    if user.accepted_terms_at.nil?
      puts "❌ Terms not accepted!"
      puts "  Accepting terms..."
      user.update!(accepted_terms_at: Time.current, accepted_privacy_at: Time.current)
      puts "✅ Terms accepted!"
    else
      puts "✅ Terms accepted"
    end
  end
  
  desc 'Fix common authentication issues'
  task fix_issues: :environment do
    puts "Fixing common authentication issues..."
    
    # Confirmar todos os usuários não confirmados
    unconfirmed_users = User.where(confirmed_at: nil)
    if unconfirmed_users.any?
      puts "Confirming #{unconfirmed_users.count} unconfirmed users..."
      unconfirmed_users.update_all(
        confirmed_at: Time.current,
        confirmation_sent_at: Time.current
      )
    end
    
    # Aceitar termos para usuários que não aceitaram
    users_without_terms = User.where(accepted_terms_at: nil)
    if users_without_terms.any?
      puts "Accepting terms for #{users_without_terms.count} users..."
      users_without_terms.update_all(
        accepted_terms_at: Time.current,
        accepted_privacy_at: Time.current
      )
    end
    
    # Verificar usuários sem conta
    users_without_account = User.where(account_id: nil)
    if users_without_account.any?
      puts "Found #{users_without_account.count} users without account"
      users_without_account.each do |user|
        puts "  - #{user.email}"
      end
    end
    
    puts "✅ Authentication issues fixed!"
  end
  
  desc 'Create a simple test user'
  task create_test_user: :environment do
    puts "Creating test user..."
    
    email = 'test@procfy.io'
    password = 'test123'
    
    # Verificar se já existe
    existing_user = User.find_by(email: email)
    if existing_user
      puts "User already exists: #{existing_user.email}"
      return
    end
    
    # Criar usuário simples
    user = User.create!(
      email: email,
      password: password,
      password_confirmation: password,
      first_name: 'Test',
      last_name: 'User',
      confirmed_at: Time.current,
      confirmation_sent_at: Time.current,
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current,
      preferred_language: 'pt-BR',
      time_zone: 'America/Sao_Paulo'
    )
    
    # Pular confirmação
    user.skip_confirmation!
    
    # Criar conta simples
    account = user.my_accounts.create!(
      account_type: :business,
      default_currency: 'BRL',
      country_code: 'BR',
      subscription_status: 'active',
      admin: true,
      free: true,
      trial: false
    )
    
    # Criar empresa
    company = account.create_company!(
      name: 'Test Company',
      person_type: :legal,
      document_1: '12345678000199',
      document_3: '12345678',
      email: email
    )
    
    # Criar account_user
    account.account_users.create!(
      user: user,
      role: :admin
    )
    
    puts "✅ Test user created!"
    puts "Email: #{email}"
    puts "Password: #{password}"
    puts "User ID: #{user.id}"
    puts "Account ID: #{account.id}"
  end

  desc 'Diagnose password issues for a user'
  task diagnose_password: :environment do
    email = ENV['EMAIL'] || 'admin@exemplo.com'
    password = ENV['PASSWORD'] || 'password'
    
    puts "=== DIAGNÓSTICO DE SENHA ==="
    puts "Email: #{email}"
    puts "Senha testada: #{password}"
    puts ""
    
    user = User.find_by(email: email)
    
    if user.nil?
      puts "❌ Usuário não encontrado!"
      puts ""
      puts "Usuários disponíveis:"
      User.all.each do |u|
        puts "  - #{u.email} (ID: #{u.id}, Provider: #{u.provider || 'none'})"
      end
      return
    end
    
    puts "✅ Usuário encontrado:"
    puts "  ID: #{user.id}"
    puts "  Email: #{user.email}"
    puts "  Nome: #{user.first_name} #{user.last_name}"
    puts "  Provider: #{user.provider || 'none (login tradicional)'}"
    puts "  UID: #{user.uid || 'none'}"
    puts "  Confirmed: #{user.confirmed_at.present? ? 'Sim' : 'Não'}"
    puts "  Encrypted Password presente: #{user.encrypted_password.present? ? 'Sim' : 'Não'}"
    puts ""
    
    # Testar senha
    if user.valid_password?(password)
      puts "✅ Senha válida!"
    else
      puts "❌ Senha inválida!"
      puts ""
      
      if user.provider.present?
        puts "⚠️  ATENÇÃO: Este usuário foi criado via OAuth (#{user.provider})"
        puts "   Usuários OAuth recebem senhas aleatórias que não são conhecidas."
        puts "   Para usar login tradicional, você precisa resetar a senha."
        puts ""
        puts "   Para resetar a senha, execute:"
        puts "   rails auth:reset_password EMAIL=#{email} PASSWORD=nova_senha"
      else
        puts "   Possíveis causas:"
        puts "   1. Senha incorreta"
        puts "   2. Senha não foi definida corretamente"
        puts "   3. Problema com criptografia do Devise"
        puts ""
        puts "   Para resetar a senha, execute:"
        puts "   rails auth:reset_password EMAIL=#{email} PASSWORD=nova_senha"
      end
    end
  end

  desc 'Reset password for a user'
  task reset_password: :environment do
    email = ENV['EMAIL']
    password = ENV['PASSWORD']
    
    unless email && password
      puts "❌ Erro: Você precisa fornecer EMAIL e PASSWORD"
      puts ""
      puts "Uso: rails auth:reset_password EMAIL=email@exemplo.com PASSWORD=nova_senha"
      return
    end
    
    puts "=== RESETAR SENHA ==="
    puts "Email: #{email}"
    puts ""
    
    user = User.find_by(email: email)
    
    if user.nil?
      puts "❌ Usuário não encontrado!"
      return
    end
    
    puts "Usuário encontrado: #{user.first_name} #{user.last_name}"
    puts "Provider: #{user.provider || 'none'}"
    puts ""
    
    # Resetar senha
    user.password = password
    user.password_confirmation = password
    
    if user.save
      puts "✅ Senha resetada com sucesso!"
      puts ""
      puts "Agora você pode fazer login com:"
      puts "  Email: #{email}"
      puts "  Senha: #{password}"
      
      # Testar a senha
      user.reload
      if user.valid_password?(password)
        puts ""
        puts "✅ Senha validada com sucesso!"
      else
        puts ""
        puts "⚠️  Aviso: A senha foi salva, mas a validação falhou. Pode haver um problema."
      end
    else
      puts "❌ Erro ao resetar senha:"
      puts user.errors.full_messages.join("\n")
    end
  end

  desc 'List all users with their authentication info'
  task list_users: :environment do
    puts "=== LISTA DE USUÁRIOS ==="
    puts ""
    
    User.all.each do |user|
      puts "ID: #{user.id}"
      puts "  Email: #{user.email}"
      puts "  Nome: #{user.first_name} #{user.last_name}"
      puts "  Provider: #{user.provider || 'none (login tradicional)'}"
      puts "  UID: #{user.uid || 'none'}"
      puts "  Confirmed: #{user.confirmed_at.present? ? 'Sim' : 'Não'}"
      puts "  Tem senha: #{user.encrypted_password.present? ? 'Sim' : 'Não'}"
      puts "  Account: #{user.account&.name || 'Nenhuma'}"
      puts "-" * 50
    end
  end
end 