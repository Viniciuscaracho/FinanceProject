# frozen_string_literal: true

namespace :chatbot do
  desc "Simula requisições de chatbot para criar agendamentos"
  task simulate: :environment do
    require 'net/http'
    require 'json'
    require 'uri'

    puts "\n=== Simulando requisições de Chatbot ==="

    account = Account.first
    unless account
      puts "❌ Erro: Nenhuma conta encontrada. Execute primeiro: bin/rails db:seed"
      exit
    end

    # Buscar dados necessários
    professional = account.account_users.first
    service = account.services.provideds.first
    contact = account.contacts.first

    unless professional && service && contact
      puts "❌ Erro: Dados insuficientes. Execute: bin/rails db:seed"
      exit
    end

    # URL da API (ajustar conforme necessário)
    api_base_url = ENV['API_URL'] || 'http://localhost:3000/api/v1'
    api_key = Rails.application.credentials.dig(:n8n, :api_key) || 'test_api_key'

    # Simular diferentes cenários de requisições do chatbot
    scenarios = [
      {
        name: "Cliente solicita serviços disponíveis",
        endpoint: "#{api_base_url}/appointments/services",
        method: :get,
        headers: { 'X-API-Key' => api_key, 'X-Account-Id' => account.id.to_s }
      },
      {
        name: "Cliente solicita profissionais disponíveis",
        endpoint: "#{api_base_url}/appointments/professionals",
        method: :get,
        headers: { 'X-API-Key' => api_key, 'X-Account-Id' => account.id.to_s }
      },
      {
        name: "Cliente solicita horários disponíveis",
        endpoint: "#{api_base_url}/appointments/available_slots",
        method: :get,
        params: {
          professional_id: professional.id,
          date: 2.days.from_now.strftime('%Y-%m-%d'),
          service_id: service.id
        },
        headers: { 'X-API-Key' => api_key, 'X-Account-Id' => account.id.to_s }
      },
      {
        name: "Cliente cria agendamento via chatbot",
        endpoint: "#{api_base_url}/appointments",
        method: :post,
        body: {
          account_id: account.id,
          appointment: {
            account_user_id: professional.id,
            service_id: service.id,
            contact_id: contact.id,
            start_time: 2.days.from_now.beginning_of_day + 10.hours,
            end_time: 2.days.from_now.beginning_of_day + 10.hours + 30.minutes,
            whatsapp_number: contact.cell_phone_number,
            price_cents: service.selling_price_cents,
            price_currency: 'BRL'
          }
        },
        headers: { 
          'X-API-Key' => api_key, 
          'X-Account-Id' => account.id.to_s,
          'Content-Type' => 'application/json'
        }
      }
    ]

    scenarios.each_with_index do |scenario, index|
      puts "\n#{index + 1}. #{scenario[:name]}"
      puts "   Endpoint: #{scenario[:endpoint]}"

      begin
        uri = URI(scenario[:endpoint])
        
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
          request[key] = value
        end

        # Adicionar body se for POST
        if scenario[:body] && scenario[:method] == :post
          request.body = scenario[:body].to_json
        end

        response = http.request(request)

        if response.code.to_i == 200 || response.code.to_i == 201
          puts "   ✅ Sucesso (#{response.code})"
          begin
            data = JSON.parse(response.body)
            puts "   Resposta: #{data.inspect[0..200]}..."
          rescue JSON::ParserError
            puts "   Resposta: #{response.body[0..200]}..."
          end
        else
          puts "   ❌ Erro (#{response.code}): #{response.body[0..200]}"
        end
      rescue => e
        puts "   ❌ Exceção: #{e.message}"
      end

      sleep 1 # Pequeno delay entre requisições
    end

    puts "\n✅ Simulação concluída!"
  end

  desc "Cria um agendamento de exemplo via API (simulando chatbot)"
  task create_appointment: :environment do
    require 'net/http'
    require 'json'
    require 'uri'

    account = Account.first
    professional = account.account_users.first
    service = account.services.provideds.first
    contact = account.contacts.first

    unless account && professional && service && contact
      puts "❌ Erro: Dados insuficientes"
      exit
    end

    api_base_url = ENV['API_URL'] || 'http://localhost:3000/api/v1'
    api_key = Rails.application.credentials.dig(:n8n, :api_key) || 'test_api_key'

    start_time = 2.days.from_now.beginning_of_day + 10.hours
    end_time = start_time + 30.minutes

    uri = URI("#{api_base_url}/appointments")
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri)
    request['X-API-Key'] = api_key
    request['X-Account-Id'] = account.id.to_s
    request['Content-Type'] = 'application/json'
    
    request.body = {
      account_id: account.id,
      appointment: {
        account_user_id: professional.id,
        service_id: service.id,
        contact_id: contact.id,
        start_time: start_time.iso8601,
        end_time: end_time.iso8601,
        whatsapp_number: contact.cell_phone_number,
        price_cents: service.selling_price_cents,
        price_currency: 'BRL'
      }
    }.to_json

    response = http.request(request)
    
    if response.code.to_i == 201
      data = JSON.parse(response.body)
      puts "✅ Agendamento criado com sucesso!"
      puts "   ID: #{data['id']}"
      puts "   Serviço: #{data['service']['name']}"
      puts "   Data: #{start_time.strftime('%d/%m/%Y %H:%M')}"
    else
      puts "❌ Erro ao criar agendamento: #{response.code}"
      puts response.body
    end
  end
end

