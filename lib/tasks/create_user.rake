# frozen_string_literal: true

namespace :users do
  desc 'Create a confirmed user with account'
  task create_confirmed_user: :environment do
    puts "Creating confirmed user..."
    
    # Dados do usuário
    email = ENV['USER_EMAIL'] || 'admin@procfy.io'
    password = ENV['USER_PASSWORD'] || 'password123'
    first_name = ENV['USER_FIRST_NAME'] || 'Admin'
    last_name = ENV['USER_LAST_NAME'] || 'User'
    
    # Verificar se o usuário já existe
    existing_user = User.find_by(email: email)
    if existing_user
      puts "User with email #{email} already exists!"
      puts "User ID: #{existing_user.id}"
      puts "Confirmed: #{existing_user.confirmed_at.present?}"
      puts "Account: #{existing_user.account&.name || 'No account'}"
      return
    end
    
    # Criar usuário
    user = User.new(
      email: email,
      password: password,
      password_confirmation: password,
      first_name: first_name,
      last_name: last_name,
      confirmed_at: Time.current,
      confirmation_sent_at: Time.current,
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current,
      preferred_language: 'pt-BR',
      time_zone: 'America/Sao_Paulo'
    )
    
    # Pular confirmação do Devise
    user.skip_confirmation!
    
    # Criar conta
    account = user.my_accounts.new(
      account_type: :business,
      default_currency: 'BRL',
      country_code: 'BR',
      subscription_status: 'active',
      admin: true,
      free: true,
      trial: false
    )
    
    # Criar relacionamento usuário-conta
    account.account_users.build(user: user, role: :admin)
    
    # Criar empresa
    company = account.build_company(
      name: "#{first_name} #{last_name}",
      person_type: :legal,
      document_1: '12345678000199', # CNPJ fictício
      document_3: '12345678',
      email: email
    )
    
    # Salvar tudo
    if user.save
      puts "✅ User created successfully!"
      puts "Email: #{user.email}"
      puts "Password: #{password}"
      puts "User ID: #{user.id}"
      puts "Account ID: #{user.account.id}"
      puts "Company: #{user.account.company.name}"
      puts "Confirmed: #{user.confirmed_at.present?}"
      puts ""
      puts "You can now login with:"
      puts "Email: #{email}"
      puts "Password: #{password}"
    else
      puts "❌ Error creating user:"
      puts user.errors.full_messages
    end
  end
  
  desc 'List all users'
  task list: :environment do
    puts "Listing all users:"
    puts "=" * 50
    
    User.all.each do |user|
      puts "ID: #{user.id}"
      puts "Email: #{user.email}"
      puts "Name: #{user.first_name} #{user.last_name}"
      puts "Confirmed: #{user.confirmed_at.present? ? 'Yes' : 'No'}"
      puts "Account: #{user.account&.name || 'No account'}"
      puts "Admin: #{user.admin? ? 'Yes' : 'No'}"
      puts "-" * 30
    end
  end
  
  desc 'Confirm all unconfirmed users'
  task confirm_all: :environment do
    unconfirmed_users = User.where(confirmed_at: nil)
    
    if unconfirmed_users.empty?
      puts "No unconfirmed users found."
      return
    end
    
    puts "Confirming #{unconfirmed_users.count} users..."
    
    unconfirmed_users.each do |user|
      user.update!(
        confirmed_at: Time.current,
        confirmation_sent_at: Time.current
      )
      puts "✅ Confirmed user: #{user.email}"
    end
    
    puts "All users confirmed!"
  end
end 