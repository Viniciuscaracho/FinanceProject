# frozen_string_literal: true

namespace :policies do
  desc 'Fix user policies'
  task fix_user_policies: :environment do
    puts "Fixing user policies..."
    
    # Buscar o usuário admin
    user = User.find_by(email: 'admin@barbermanagement.io')
    
    if user.nil?
      puts "❌ Admin user not found!"
      return
    end
    
    puts "Fixing policies for user: #{user.email}"
    
    # Corrigir políticas para todas as contas do usuário
    user.account_users.each do |account_user|
      puts "  Fixing policies for account: #{account_user.account.name}"
      
      if account_user.policies.empty?
        account_user.policies = AccountUser::DEFAULT_POLICIES
        account_user.save!
        puts "    ✅ Policies updated"
      else
        puts "    ℹ️  Policies already set"
      end
    end
    
    puts "✅ User policies fixed!"
  end
  
  desc 'Fix all account users policies'
  task fix_all_policies: :environment do
    puts "Fixing all account users policies..."
    
    account_users_without_policies = AccountUser.where(policies: [])
    
    if account_users_without_policies.empty?
      puts "No account users without policies found."
      return
    end
    
    puts "Found #{account_users_without_policies.count} account users without policies"
    
    account_users_without_policies.each do |account_user|
      puts "  Fixing policies for #{account_user.user.email} in #{account_user.account.name}"
      account_user.policies = AccountUser::DEFAULT_POLICIES
      account_user.save!
    end
    
    puts "✅ All policies fixed!"
  end
  
  desc 'Show user permissions'
  task show_permissions: :environment do
    puts "Showing user permissions..."
    
    user = User.find_by(email: 'admin@barbermanagement.io')
    
    if user.nil?
      puts "❌ Admin user not found!"
      return
    end
    
    puts "User: #{user.email}"
    puts "Account: #{user.account&.name}"
    
    user.account_users.each do |account_user|
      puts "\nAccount: #{account_user.account.name}"
      puts "Role: #{account_user.role}"
      puts "Policies count: #{account_user.policies.count}"
      
      if account_user.policies.any?
        puts "Policies:"
        account_user.policies.each do |policy|
          puts "  - #{policy}"
        end
      else
        puts "  No policies set!"
      end
    end
  end
end 