# frozen_string_literal: true

namespace :whatsapp do
  desc 'Test WhatsApp message processing'
  task test: :environment do
    account = Account.first
    
    unless account
      puts "❌ Nenhum account encontrado. Crie um account primeiro."
      exit 1
    end

    puts "🧪 Testando processamento de mensagens do WhatsApp"
    puts "=" * 60
    puts "Account: #{account.name || account.id}"
    puts "=" * 60
    puts

    test_messages = [
      {
        message: "Agendar corte de cabelo para amanhã às 14h",
        description: "Agendamento completo"
      },
      {
        message: "Quais serviços vocês têm?",
        description: "Listar serviços"
      },
      {
        message: "Quais horários disponíveis amanhã?",
        description: "Consultar horários"
      },
      {
        message: "Agendar barba para segunda-feira às 10h, valor R$ 30",
        description: "Agendamento com valor específico"
      }
    ]

    test_messages.each_with_index do |test, index|
      puts "\n📱 Teste #{index + 1}: #{test[:description]}"
      puts "Mensagem: #{test[:message]}"
      puts "-" * 60

      begin
        # Parsear mensagem
        parser = WhatsApp::MessageParser.new(
          message: test[:message],
          account: account
        )
        parsed = parser.parse

        puts "Intent detectado: #{parsed[:intent]}"
        puts "Serviço: #{parsed[:service]&.dig(:name) || 'Não encontrado'}"
        puts "Preço: #{parsed[:price] ? "R$ #{parsed[:price] / 100.0}" : 'Não encontrado'}"
        puts "Data: #{parsed[:date] || 'Não encontrado'}"
        puts "Horário: #{parsed[:time] || 'Não encontrado'}"

        # Se for agendamento, tentar criar
        if parsed[:intent] == :schedule && parsed[:service] && parsed[:date] && parsed[:time]
          puts "\n🔄 Tentando criar agendamento..."
          
          creator = WhatsApp::AppointmentCreator.new(
            account: account,
            parsed_data: parsed,
            whatsapp_number: "+5511999999999"
          )
          
          result = creator.create
          
          if result[:success]
            puts "✅ Agendamento criado com sucesso!"
            puts "   ID: #{result[:appointment].id}"
            puts "   Data: #{result[:appointment].start_time.strftime('%d/%m/%Y %H:%M')}"
            puts "   Valor: R$ #{result[:appointment].price_cents / 100.0}"
          else
            puts "❌ Erro: #{result[:error]}"
          end
        end

        # Gerar resposta
        response = WhatsApp::ResponseBuilder.new(
          intent: parsed[:intent],
          account: account,
          parsed_data: parsed
        ).build

        puts "\n💬 Resposta do sistema:"
        puts response

      rescue StandardError => e
        puts "❌ Erro: #{e.message}"
        puts e.backtrace.first(3).join("\n")
      end

      puts "\n" + "=" * 60
    end

    puts "\n✅ Testes concluídos!"
  end

  desc 'Test WhatsApp webhook endpoint'
  task test_webhook: :environment do
    account = Account.first
    
    unless account
      puts "❌ Nenhum account encontrado."
      exit 1
    end

    puts "🧪 Testando webhook do WhatsApp"
    puts "=" * 60
    
    # Simular requisição webhook
    test_data = {
      message: "Agendar corte de cabelo para amanhã às 14h",
      from: "+5511999999999"
    }

    puts "Enviando mensagem: #{test_data[:message]}"
    puts "De: #{test_data[:from]}"
    puts

    begin
      WhatsApp::ProcessMessageJob.perform_now(
        account_id: account.id,
        message: test_data[:message],
        whatsapp_number: test_data[:from]
      )
      
      puts "✅ Mensagem processada com sucesso!"
    rescue StandardError => e
      puts "❌ Erro: #{e.message}"
      puts e.backtrace.first(5).join("\n")
    end
  end
end

