# frozen_string_literal: true

namespace :stripe do
  namespace :plans do
    desc "Criar planos de teste no Stripe para o BarberManagement"
    task create_test: :environment do
      puts "🎯 Criando planos de teste no Stripe para BarberManagement..."
      puts ""

      unless BarberManagement::Stripe::Client.configured?
        puts "❌ Stripe não está configurado!"
        puts "   Configure as credenciais primeiro: rails credentials:edit --environment development"
        exit 1
      end

      BarberManagement::Stripe::Client.with_api_key do
        # Plano Básico - Mensal
        begin
          product_basic = ::Stripe::Product.create(
            name: "BarberManagement - Plano Básico",
            description: "Plano básico para pequenos negócios. Ideal para iniciantes.",
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'basic',
                plan_tier: 'starter'
              }
            )
          )

          price_basic_monthly = ::Stripe::Price.create(
            unit_amount: 4900, # R$ 49,00
            currency: 'brl',
            recurring: { interval: 'month' },
            product: product_basic.id,
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'basic',
                billing_interval: 'monthly'
              }
            )
          )

          puts "✅ Plano Básico Mensal criado:"
          puts "   Produto ID: #{product_basic.id}"
          puts "   Preço ID: #{price_basic_monthly.id}"
          puts "   Valor: R$ 49,00/mês"
          puts ""
        rescue => e
          puts "⚠️  Erro ao criar Plano Básico: #{e.message}"
        end

        # Plano Básico - Anual
        begin
          price_basic_yearly = ::Stripe::Price.create(
            unit_amount: 49000, # R$ 490,00 (2 meses grátis)
            currency: 'brl',
            recurring: { interval: 'year' },
            product: product_basic.id,
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'basic',
                billing_interval: 'yearly'
              }
            )
          )

          puts "✅ Plano Básico Anual criado:"
          puts "   Preço ID: #{price_basic_yearly.id}"
          puts "   Valor: R$ 490,00/ano (economia de 2 meses)"
          puts ""
        rescue => e
          puts "⚠️  Erro ao criar Plano Básico Anual: #{e.message}"
        end

        # Plano Profissional - Mensal
        begin
          product_pro = ::Stripe::Product.create(
            name: "BarberManagement - Plano Profissional",
            description: "Plano profissional com recursos avançados. Ideal para empresas em crescimento.",
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'professional',
                plan_tier: 'business'
              }
            )
          )

          price_pro_monthly = ::Stripe::Price.create(
            unit_amount: 9900, # R$ 99,00
            currency: 'brl',
            recurring: { interval: 'month' },
            product: product_pro.id,
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'professional',
                billing_interval: 'monthly',
                popular: 'true'
              }
            )
          )

          puts "✅ Plano Profissional Mensal criado:"
          puts "   Produto ID: #{product_pro.id}"
          puts "   Preço ID: #{price_pro_monthly.id}"
          puts "   Valor: R$ 99,00/mês"
          puts "   ⭐ Marcado como popular"
          puts ""
        rescue => e
          puts "⚠️  Erro ao criar Plano Profissional: #{e.message}"
        end

        # Plano Profissional - Anual
        begin
          price_pro_yearly = ::Stripe::Price.create(
            unit_amount: 99000, # R$ 990,00 (2 meses grátis)
            currency: 'brl',
            recurring: { interval: 'year' },
            product: product_pro.id,
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'professional',
                billing_interval: 'yearly',
                popular: 'true'
              }
            )
          )

          puts "✅ Plano Profissional Anual criado:"
          puts "   Preço ID: #{price_pro_yearly.id}"
          puts "   Valor: R$ 990,00/ano (economia de 2 meses)"
          puts ""
        rescue => e
          puts "⚠️  Erro ao criar Plano Profissional Anual: #{e.message}"
        end

        # Plano Empresarial - Mensal
        begin
          product_enterprise = ::Stripe::Product.create(
            name: "BarberManagement - Plano Empresarial",
            description: "Plano empresarial com todos os recursos. Ideal para grandes empresas e franquias.",
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'enterprise',
                plan_tier: 'enterprise'
              }
            )
          )

          price_enterprise_monthly = ::Stripe::Price.create(
            unit_amount: 19900, # R$ 199,00
            currency: 'brl',
            recurring: { interval: 'month' },
            product: product_enterprise.id,
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'enterprise',
                billing_interval: 'monthly'
              }
            )
          )

          puts "✅ Plano Empresarial Mensal criado:"
          puts "   Produto ID: #{product_enterprise.id}"
          puts "   Preço ID: #{price_enterprise_monthly.id}"
          puts "   Valor: R$ 199,00/mês"
          puts ""
        rescue => e
          puts "⚠️  Erro ao criar Plano Empresarial: #{e.message}"
        end

        # Plano Empresarial - Anual
        begin
          price_enterprise_yearly = ::Stripe::Price.create(
            unit_amount: 199000, # R$ 1.990,00 (2 meses grátis)
            currency: 'brl',
            recurring: { interval: 'year' },
            product: product_enterprise.id,
            metadata: BarberManagement::Stripe::Client.default_metadata(
              account_id: nil,
              user_id: nil,
              additional: {
                plan_type: 'enterprise',
                billing_interval: 'yearly'
              }
            )
          )

          puts "✅ Plano Empresarial Anual criado:"
          puts "   Preço ID: #{price_enterprise_yearly.id}"
          puts "   Valor: R$ 1.990,00/ano (economia de 2 meses)"
          puts ""
        rescue => e
          puts "⚠️  Erro ao criar Plano Empresarial Anual: #{e.message}"
        end

        puts "🎉 Planos criados com sucesso!"
        puts ""
        puts "📋 Resumo dos Planos:"
        puts "   - Básico: R$ 49/mês ou R$ 490/ano"
        puts "   - Profissional: R$ 99/mês ou R$ 990/ano (⭐ Popular)"
        puts "   - Empresarial: R$ 199/mês ou R$ 1.990/ano"
        puts ""
        puts "💡 Você pode ver todos os planos no Stripe Dashboard:"
        puts "   https://dashboard.stripe.com/test/products"
      end
    end

    desc "Listar todos os planos do Stripe"
    task list: :environment do
      puts "📋 Listando planos do Stripe..."
      puts ""

      unless BarberManagement::Stripe::Client.configured?
        puts "❌ Stripe não está configurado!"
        exit 1
      end

      BarberManagement::Stripe::Client.with_api_key do
        products = ::Stripe::Product.list(active: true, limit: 100)
        prices = ::Stripe::Price.list(active: true, limit: 100)

        products.data.each do |product|
          # Verificar se é do BarberManagement
          is_barber_management = product.metadata['source'] == 'barber_management' ||
                                 product.metadata['project'] == 'BarberManagement'

          next unless is_barber_management

          puts "📦 #{product.name}"
          puts "   ID: #{product.id}"
          puts "   Descrição: #{product.description}"
          puts ""

          product_prices = prices.data.select { |p| p.product == product.id }
          product_prices.each do |price|
            amount = price.unit_amount / 100.0
            interval = price.recurring&.interval || 'one-time'
            interval_pt = interval == 'month' ? 'mês' : interval == 'year' ? 'ano' : interval

            puts "   💰 R$ #{amount} / #{interval_pt}"
            puts "      Price ID: #{price.id}"
            puts "      Popular: #{price.metadata['popular'] == 'true' ? 'Sim ⭐' : 'Não'}"
            puts ""
          end
        end

        if products.data.empty?
          puts "⚠️  Nenhum plano encontrado."
          puts "   Execute: rake stripe:plans:create_test"
        end
      end
    end
  end
end

