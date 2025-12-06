# frozen_string_literal: true

namespace :subscription do
  desc "Diagnose subscription issues for an account"
  task :diagnose, [:account_id] => :environment do |_t, args|
    account_id = args[:account_id]
    
    unless account_id
      puts "❌ Por favor, forneça o account_id: rake subscription:diagnose[ACCOUNT_ID]"
      exit 1
    end
    
    account = Account.find_by(id: account_id)
    unless account
      puts "❌ Account não encontrado com ID: #{account_id}"
      exit 1
    end
    
    puts "\n🔍 Diagnóstico de Subscription para Account #{account.id}"
    puts "=" * 60
    puts "\n📋 Informações do Account:"
    puts "  - ID: #{account.id}"
    puts "  - Nome: #{account.name}"
    puts "  - processor_customer_id: #{account.processor_customer_id || 'NÃO DEFINIDO'}"
    puts "  - subscription_id: #{account.subscription_id || 'NÃO DEFINIDO'}"
    puts "  - subscription_status: #{account.subscription_status || 'NÃO DEFINIDO'}"
    
    puts "\n📦 Subscriptions no banco:"
    subscriptions = account.subscriptions
    if subscriptions.empty?
      puts "  ⚠️  Nenhuma subscription encontrada no banco de dados"
    else
      subscriptions.each do |sub|
        puts "  - Subscription ID: #{sub.id}"
        puts "    processor_id: #{sub.processor_id}"
        puts "    status: #{sub.status}"
        puts "    plan_id: #{sub.plan_id}"
        puts "    created_at: #{sub.created_at}"
        puts "    updated_at: #{sub.updated_at}"
      end
    end
    
    puts "\n🔗 Associações:"
    puts "  - account.subscription (belongs_to): #{account.subscription&.id || 'nil'}"
    puts "  - account.last_active_subscription: #{account.last_active_subscription&.id || 'nil'}"
    puts "  - account.last_subscription: #{account.last_subscription&.id || 'nil'}"
    
    if account.processor_customer_id.present?
      puts "\n🌐 Verificando no Stripe:"
      begin
        BarberManagement::Stripe::Client.with_api_key do
          stripe_subscriptions = ::Stripe::Subscription.list(customer: account.processor_customer_id, limit: 10)
          
          if stripe_subscriptions.data.empty?
            puts "  ⚠️  Nenhuma subscription encontrada no Stripe para este customer"
          else
            puts "  ✅ Encontradas #{stripe_subscriptions.data.count} subscriptions no Stripe:"
            stripe_subscriptions.data.each do |stripe_sub|
              puts "    - Subscription ID: #{stripe_sub.id}"
              puts "      status: #{stripe_sub.status}"
              puts "      plan: #{stripe_sub.items.data.first&.price&.id}"
              puts "      current_period_end: #{Time.at(stripe_sub.current_period_end)}"
              
              # Verificar se existe no banco
              local_sub = account.subscriptions.find_by(processor_id: stripe_sub.id)
              if local_sub
                puts "      ✅ Existe no banco (ID: #{local_sub.id})"
              else
                puts "      ⚠️  NÃO existe no banco - precisa sincronizar!"
              end
            end
          end
        end
      rescue StandardError => e
        puts "  ❌ Erro ao consultar Stripe: #{e.message}"
      end
    else
      puts "\n⚠️  processor_customer_id não está definido - não é possível verificar no Stripe"
    end
    
    puts "\n📝 Webhooks recentes:"
    recent_webhooks = SubscriptionWebhook.order(created_at: :desc).limit(5)
    if recent_webhooks.empty?
      puts "  ⚠️  Nenhum webhook encontrado"
    else
      recent_webhooks.each do |webhook|
        puts "  - Webhook ID: #{webhook.id}"
        puts "    event_type: #{webhook.event_type}"
        puts "    status: #{webhook.status}"
        puts "    created_at: #{webhook.created_at}"
        if webhook.failed?
          puts "    ❌ Erro: #{webhook.details['message_log']}"
        end
      end
    end
    
    puts "\n" + "=" * 60
    puts "\n💡 Recomendações:"
    
    if account.processor_customer_id.blank?
      puts "  1. O account não tem processor_customer_id - precisa criar customer no Stripe"
    end
    
    if subscriptions.empty? && account.processor_customer_id.present?
      puts "  2. Nenhuma subscription no banco - execute: account.sync_subscriptions!"
    end
    
    if account.subscription_id.blank? && subscriptions.any?
      puts "  3. Account não tem subscription_id associado - execute: account.assign_subscription_attributes(subscription)"
    end
    
    puts "\n"
  end
end

