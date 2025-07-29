# frozen_string_literal: true

namespace :debug do
  desc 'Debug and fix policies directly'
  task fix_policies_directly: :environment do
    puts "Debugging and fixing policies directly..."
    
    user = User.find_by(email: 'admin@procfy.io')
    
    if user.nil?
      puts "❌ User not found!"
      return
    end
    
    puts "User: #{user.email}"
    
    user.account_users.each do |account_user|
      puts "\nAccount: #{account_user.account.name}"
      puts "Role: #{account_user.role}"
      puts "Current policies: #{account_user.policies.inspect}"
      
      # Forçar a atribuição das políticas
      account_user.policies = AccountUser::DEFAULT_POLICIES
      account_user.save!
      
      # Recarregar para verificar
      account_user.reload
      puts "Updated policies: #{account_user.policies.inspect}"
      puts "Policies count: #{account_user.policies.count}"
    end
    
    puts "\n✅ Policies fixed directly!"
  end
  
  desc 'Show all account users'
  task show_account_users: :environment do
    puts "Showing all account users..."
    
    AccountUser.includes(:user, :account).each do |account_user|
      puts "\nAccountUser ID: #{account_user.id}"
      puts "User: #{account_user.user.email}"
      puts "Account: #{account_user.account.name}"
      puts "Role: #{account_user.role}"
      puts "Policies: #{account_user.policies.inspect}"
      puts "Policies count: #{account_user.policies.count}"
    end
  end
  
  desc 'Test user login'
  task test_login: :environment do
    puts "Testing user login..."
    
    user = User.find_by(email: 'admin@procfy.io')
    
    if user.nil?
      puts "❌ User not found!"
      return
    end
    
    puts "User found: #{user.email}"
    puts "Confirmed: #{user.confirmed_at.present?}"
    puts "Account: #{user.account&.name}"
    
    # Simular login
    if user.valid_password?('password123')
      puts "✅ Password is valid"
      
      # Verificar se o usuário pode acessar
      Current.user = user
      Current.account = user.account
      
      puts "Current user: #{Current.user.email}"
      puts "Current account: #{Current.account&.name}"
      
      # Testar algumas permissões
      if user.policy?(:home, :read)
        puts "✅ User can read home"
      else
        puts "❌ User cannot read home"
      end
      
      if user.policy?(:transactions, :revenues, :read)
        puts "✅ User can read revenues"
      else
        puts "❌ User cannot read revenues"
      end
      
    else
      puts "❌ Password is invalid"
    end
  end
end 