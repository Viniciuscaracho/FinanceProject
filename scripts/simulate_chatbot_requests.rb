#!/usr/bin/env ruby
# frozen_string_literal: true

# Script para simular requisições de chatbot
# Uso: bin/rails runner scripts/simulate_chatbot_requests.rb

require 'net/http'
require 'json'
require 'uri'

puts "\n=== Simulando Requisições de Chatbot ===\n"

# Configurações
API_BASE_URL = ENV['API_URL'] || 'http://localhost:3000/api/v1'
# Para endpoints públicos, usar API key (se configurada)
# Para endpoints autenticados, usar token de usuário
expected_key = Rails.application.credentials.dig(:n8n, :api_key)
API_KEY = ENV['API_KEY'] || expected_key || (Rails.env.development? ? 'dev_api_key_12345' : nil)

# Buscar dados do banco
account = Account.first
unless account
  puts "❌ Erro: Nenhuma conta encontrada. Execute: bin/rails db:seed"
  exit 1
end

professional = account.account_users.where.not(user_id: account.owner_id).first
service = account.services.provideds.first
contact = account.contacts.first

unless professional && service && contact
  puts "❌ Erro: Dados insuficientes. Execute: bin/rails db:seed"
  exit 1
end

puts "📋 Dados encontrados:"
puts "   - Conta: #{account.id}"
puts "   - Profissional: #{professional.user.first_name} #{professional.user.last_name} (ID: #{professional.id})"
puts "   - Serviço: #{service.name} (ID: #{service.id}, R$ #{Money.new(service.selling_price_cents, 'BRL').format})"
puts "   - Contato: #{contact.first_name} #{contact.last_name} (#{contact.cell_phone_number}, ID: #{contact.id})"
puts ""

puts "📋 Dados encontrados:"
puts "   - Conta: #{account.id}"
puts "   - Profissional: #{professional.user.first_name} #{professional.user.last_name}"
puts "   - Serviço: #{service.name} (R$ #{Money.new(service.selling_price_cents, 'BRL').format})"
puts "   - Contato: #{contact.first_name} #{contact.last_name} (#{contact.cell_phone_number})"
puts ""

# Obter token de autenticação do usuário admin
user = account.owner
token_data = {
  user_id: user.id,
  exp: 24.hours.from_now.to_i
}
auth_token = Base64.strict_encode64(token_data.to_json)

# Cenários de simulação
scenarios = [
  {
    name: "1. Cliente solicita serviços disponíveis (via API key - chatbot)",
    method: :get,
    endpoint: "/appointments/services",
    use_api_key: true,
    headers: {
      'X-API-Key' => API_KEY,
      'X-Account-Id' => account.id.to_s
    }
  },
  {
    name: "2. Cliente solicita profissionais disponíveis (via token - frontend)",
    method: :get,
    endpoint: "/appointments/professionals",
    use_api_key: false,
    headers: {
      'Authorization' => "Bearer #{auth_token}",
      'Content-Type' => 'application/json'
    }
  },
  {
    name: "3. Cliente solicita horários disponíveis (via API key - chatbot)",
    method: :get,
    endpoint: "/appointments/available_slots",
    use_api_key: true,
    params: {
      professional_id: professional.id,
      date: 2.days.from_now.strftime('%Y-%m-%d'),
      service_id: service.id
    },
    headers: {
      'X-API-Key' => API_KEY,
      'X-Account-Id' => account.id.to_s
    }
  },
  {
    name: "4. Cliente cria agendamento via chatbot (via API key)",
    method: :post,
    endpoint: "/appointments",
    use_api_key: true,
    body: lambda {
      # Calcular horário disponível dinamicamente
      base_time = 3.days.from_now.beginning_of_day + 14.hours
      # Verificar se já existe agendamento neste horário
      existing = Appointment.where(
        account_user_id: professional.id,
        start_time: base_time..(base_time + 1.hour)
      ).where.not(status: Appointment::APPOINTMENT_STATUS[:canceled]).first
      
      start_time = existing ? (base_time + 2.hours) : base_time
      end_time = start_time + 30.minutes
      
      {
        account_user_id: professional.id,
        service_id: service.id,
        contact_id: contact.id,
        start_time: start_time,
        end_time: end_time,
        whatsapp_number: contact.cell_phone_number,
        price_cents: service.selling_price_cents,
        price_currency: 'BRL'
      }
    },
    headers: {
      'X-API-Key' => API_KEY,
      'X-Account-Id' => account.id.to_s,
      'Content-Type' => 'application/json'
    }
  }
]

# Executar cenários
scenarios.each do |scenario|
  puts "#{scenario[:name]}"
  puts "   Endpoint: #{scenario[:endpoint]}"
  
  begin
    uri = URI("#{API_BASE_URL}#{scenario[:endpoint]}")
    
    if scenario[:params]
      uri.query = URI.encode_www_form(scenario[:params])
    end

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.read_timeout = 10

    request_class = case scenario[:method]
                    when :get
                      Net::HTTP::Get
                    when :post
                      Net::HTTP::Post
                    else
                      Net::HTTP::Get
                    end

    request = request_class.new(uri)
    
    # Adicionar headers
    scenario[:headers]&.each do |key, value|
      request[key] = value.to_s
    end

        # Adicionar body se for POST
        if scenario[:body] && scenario[:method] == :post
          body_data = scenario[:body].is_a?(Proc) ? scenario[:body].call : scenario[:body]
          request.body = body_data.to_json
          puts "   Body: #{body_data.to_json[0..100]}..."
        end

    response = http.request(request)

    if response.code.to_i == 200 || response.code.to_i == 201
      puts "   ✅ Sucesso (#{response.code})"
      begin
        data = JSON.parse(response.body)
        if data.is_a?(Array)
          puts "   Resposta: Array com #{data.length} itens"
        elsif data.is_a?(Hash)
          puts "   Resposta: #{data.keys.join(', ')}"
          if data['id']
            puts "   ID criado: #{data['id']}"
          end
        end
      rescue JSON::ParserError
        puts "   Resposta: #{response.body[0..100]}..."
      end
    else
      puts "   ❌ Erro (#{response.code})"
      begin
        error_data = JSON.parse(response.body)
        puts "   Erro: #{error_data['error'] || error_data.inspect}"
      rescue JSON::ParserError
        puts "   Erro: #{response.body[0..200]}"
      end
    end
  rescue => e
    puts "   ❌ Exceção: #{e.message}"
    puts "   #{e.class}"
  end

  puts ""
  sleep 0.5 # Pequeno delay entre requisições
end

puts "✅ Simulação concluída!"
puts "\nPara executar novamente:"
puts "  bin/rails runner scripts/simulate_chatbot_requests.rb"

