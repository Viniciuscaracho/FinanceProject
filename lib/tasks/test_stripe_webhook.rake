# frozen_string_literal: true

namespace :stripe do
  namespace :webhook do
    desc "Simula um webhook do Stripe para testar localmente"
    task :simulate, [:event_type, :account_id] => :environment do |_t, args|
      event_type = args[:event_type] || 'checkout.session.completed'
      account_id = args[:account_id]
      
      unless account_id
        puts "❌ Por favor, forneça o account_id: rake stripe:webhook:simulate[EVENT_TYPE,ACCOUNT_ID]"
        puts "\n📋 Eventos disponíveis:"
        puts "  - checkout.session.completed"
        puts "  - customer.subscription.created"
        puts "  - customer.subscription.updated"
        puts "  - invoice.payment_succeeded"
        exit 1
      end
      
      account = Account.find_by(id: account_id)
      unless account
        puts "❌ Account não encontrado com ID: #{account_id}"
        exit 1
      end
      
      puts "\n🧪 Simulando webhook do Stripe"
      puts "=" * 60
      puts "Evento: #{event_type}"
      puts "Account ID: #{account.id}"
      puts "Customer ID: #{account.processor_customer_id || 'NÃO DEFINIDO'}"
      puts ""
      
      # Criar um evento simulado baseado no tipo
      event_data = build_event_data(event_type, account)
      
      if event_data.nil?
        puts "❌ Tipo de evento não suportado: #{event_type}"
        exit 1
      end
      
      # Criar um evento Stripe simulado
      stripe_event = build_stripe_event(event_type, event_data)
      
      # Processar o webhook
      puts "📤 Enviando evento para o handler..."
      begin
        # Para checkout.session.completed, precisamos criar uma subscription real no Stripe
        # ou mockar a chamada ao Stripe
        if event_type == 'checkout.session.completed' && account.processor_customer_id.present?
          puts "⚠️  Para checkout.session.completed, é necessário ter uma subscription real no Stripe"
          puts "   Ou use customer.subscription.created diretamente"
          puts ""
          puts "💡 Tentando criar subscription de teste no Stripe..."
          
          begin
            BarberManagement::Stripe::Client.with_api_key do
              # Buscar um price_id válido
              prices = ::Stripe::Price.list(active: true, limit: 1)
              if prices.data.empty?
                puts "❌ Nenhum price encontrado no Stripe. Crie um plano primeiro."
                exit 1
              end
              
              price_id = prices.data.first.id
              puts "   Usando price: #{price_id}"
              
              # Criar subscription de teste
              stripe_subscription = ::Stripe::Subscription.create(
                customer: account.processor_customer_id,
                items: [{ price: price_id }],
                metadata: {
                  source: 'barber_management',
                  account_id: account.id.to_s,
                  test: 'true'
                }
              )
              
              puts "   ✅ Subscription criada: #{stripe_subscription.id}"
              
              # Atualizar o evento com a subscription real
              event_data[:subscription] = stripe_subscription.id
              stripe_event = build_stripe_event(event_type, event_data)
            end
          rescue StandardError => e
            puts "   ⚠️  Erro ao criar subscription no Stripe: #{e.message}"
            puts "   Continuando com simulação..."
          end
        end
        
        result = BarberManagement::Stripe::WebhookHandler.call(event: stripe_event)
        
        if result.success?
          puts "✅ Webhook processado com sucesso!"
          puts "\n📋 Verificando resultado:"
          
          account.reload
          puts "  - subscription_id: #{account.subscription_id || 'nil'}"
          puts "  - subscription_status: #{account.subscription_status || 'nil'}"
          puts "  - subscriptions count: #{account.subscriptions.count}"
          
          if account.subscription
            puts "  - subscription status: #{account.subscription.status}"
            puts "  - subscription processor_id: #{account.subscription.processor_id}"
          end
        else
          puts "❌ Erro ao processar webhook: #{result.error || result.message}"
        end
      rescue StandardError => e
        puts "❌ Erro: #{e.message}"
        puts e.backtrace.first(5).join("\n")
      end
      
      puts "\n" + "=" * 60
    end
    
    desc "Lista eventos disponíveis para simulação"
    task :list_events => :environment do
      puts "\n📋 Eventos disponíveis para simulação:"
      puts "=" * 60
      puts "1. checkout.session.completed - Quando checkout é completado"
      puts "2. customer.subscription.created - Quando subscription é criada"
      puts "3. customer.subscription.updated - Quando subscription é atualizada"
      puts "4. invoice.payment_succeeded - Quando pagamento é bem-sucedido"
      puts "\n💡 Uso: rake stripe:webhook:simulate[EVENT_TYPE,ACCOUNT_ID]"
      puts "   Exemplo: rake stripe:webhook:simulate[checkout.session.completed,1]"
      puts ""
    end
    
    private
    
    def build_event_data(event_type, account)
      case event_type
      when 'checkout.session.completed'
        {
          id: "cs_test_#{SecureRandom.hex(12)}",
          object: "checkout.session",
          client_reference_id: account.id.to_s,
          customer: account.processor_customer_id || "cus_test_#{SecureRandom.hex(12)}",
          subscription: "sub_test_#{SecureRandom.hex(12)}",
          mode: "subscription",
          payment_status: "paid",
          metadata: {
            source: "barber_management",
            project: "BarberManagement",
            account_id: account.id.to_s
          }
        }
      when 'customer.subscription.created', 'customer.subscription.updated'
        subscription_id = "sub_test_#{SecureRandom.hex(12)}"
        price_id = "price_test_#{SecureRandom.hex(8)}"
        {
          id: subscription_id,
          object: "subscription",
          customer: account.processor_customer_id || "cus_test_#{SecureRandom.hex(12)}",
          status: "active",
          current_period_start: Time.now.to_i,
          current_period_end: (Time.now + 1.month).to_i,
          cancel_at_period_end: false,
          plan: OpenStruct.new(
            id: price_id,
            object: "plan",
            nickname: "Plano Teste",
            product: "prod_test_#{SecureRandom.hex(8)}",
            metadata: {}
          ),
          metadata: {
            source: "barber_management",
            account_id: account.id.to_s
          }
        }
      when 'invoice.payment_succeeded'
        # Usar a subscription existente se houver
        existing_subscription = account.subscriptions.last
        subscription_id = if existing_subscription
                            existing_subscription.processor_id
                          else
                            "sub_test_#{SecureRandom.hex(12)}"
                          end
        
        {
          id: "in_test_#{SecureRandom.hex(12)}",
          object: "invoice",
          customer: account.processor_customer_id || "cus_test_#{SecureRandom.hex(12)}",
          subscription: subscription_id,
          status: "paid",
          amount_paid: 19900,
          currency: "brl",
          metadata: {
            source: "barber_management",
            account_id: account.id.to_s
          }
        }
      else
        nil
      end
    end
    
    def build_stripe_event(event_type, event_data)
      # Criar um objeto que simula um Stripe::Event
      # O Stripe::Event tem uma estrutura específica, vamos criar algo compatível
      
      # Converter hash para OpenStruct recursivamente
      event_object = hash_to_openstruct(event_data)
      
      # Para checkout.session.completed, precisamos de subscription como string
      if event_type == 'checkout.session.completed' && event_data[:subscription]
        event_object.subscription = event_data[:subscription]
      end
      
      # Para invoice.payment_succeeded, subscription também precisa ser string
      if event_type == 'invoice.payment_succeeded' && event_data[:subscription]
        event_object.subscription = event_data[:subscription]
      end
      
      # Adicionar método to_hash para compatibilidade com Stripe
      def event_object.to_hash
        self.to_h
      end
      
      OpenStruct.new(
        type: event_type,
        id: "evt_test_#{SecureRandom.hex(12)}",
        data: OpenStruct.new(
          object: event_object
        )
      )
    end
    
    def hash_to_openstruct(obj)
      case obj
      when Hash
        struct = OpenStruct.new
        obj.each do |key, value|
          struct[key] = hash_to_openstruct(value)
        end
        struct
      when Array
        obj.map { |item| hash_to_openstruct(item) }
      else
        obj
      end
    end
  end
end

