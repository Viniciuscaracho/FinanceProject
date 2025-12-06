# frozen_string_literal: true

module WhatsApp
  class MessageParser
    attr_reader :message, :account

    def initialize(message:, account:)
      @message = message.to_s.downcase.strip
      @account = account
    end

    def parse
      {
        intent: detect_intent,
        service: extract_service,
        price: extract_price,
        date: extract_date,
        time: extract_time,
        client_name: extract_client_name,
        phone: extract_phone,
        confirmation: extract_confirmation
      }
    end

    private

    def detect_intent
      return :schedule if scheduling_keywords.any? { |keyword| message.include?(keyword) }
      return :cancel if cancel_keywords.any? { |keyword| message.include?(keyword) }
      return :list_services if list_keywords.any? { |keyword| message.include?(keyword) }
      return :query if query_keywords.any? { |keyword| message.include?(keyword) }
      
      :unknown
    end

    def extract_service
      # Buscar serviços do account (enabled = 't' significa habilitado)
      services = account.services.where(enabled: 't').pluck(:name, :id)
      
      services.each do |service_name, _|
        service_variations = [
          service_name.downcase,
          service_name.downcase.gsub(/\s+/, ''),
          service_name.downcase.split.first, # Primeira palavra
        ]
        
        if service_variations.any? { |variation| message.include?(variation) }
          return { name: service_name, id: account.services.find_by(name: service_name)&.id }
        end
      end

      # Tentar extrair por palavras-chave comuns
      service_keywords = {
        'corte' => 'Corte de Cabelo',
        'cabelo' => 'Corte de Cabelo',
        'barba' => 'Corte de Barba',
        'sobrancelha' => 'Design de Sobrancelha',
        'tintura' => 'Tintura',
        'escova' => 'Escova',
        'alisamento' => 'Alisamento',
        'progressiva' => 'Progressiva',
        'manicure' => 'Manicure',
        'pedicure' => 'Pedicure'
      }

      service_keywords.each do |keyword, service_name|
        if message.include?(keyword)
          service = account.services.find_by(name: service_name)
          return { name: service_name, id: service&.id } if service
        end
      end

      nil
    end

    def extract_price
      # Padrões para valores: R$ 50, 50 reais, 50,00, etc.
      price_patterns = [
        /r\$\s*(\d+[.,]?\d*)/i,
        /(\d+[.,]\d{2})\s*reais?/i,
        /(\d+[.,]\d{2})/,
        /(\d+)\s*reais?/i
      ]

      price_patterns.each do |pattern|
        match = message.match(pattern)
        if match
          price_str = match[1].gsub(',', '.')
          return (price_str.to_f * 100).to_i # Converter para centavos
        end
      end

      nil
    end

    def extract_date
      today = Date.current
      
      # Hoje
      return today if message.include?('hoje') || message.include?('today')
      
      # Amanhã
      return today + 1.day if message.include?('amanhã') || message.include?('amanha') || message.include?('tomorrow')
      
      # Dias da semana
      weekdays = {
        'segunda' => 1, 'monday' => 1,
        'terça' => 2, 'terca' => 2, 'tuesday' => 2,
        'quarta' => 3, 'wednesday' => 3,
        'quinta' => 4, 'thursday' => 4,
        'sexta' => 5, 'friday' => 5,
        'sábado' => 6, 'sabado' => 6, 'saturday' => 6,
        'domingo' => 7, 'sunday' => 7
      }
      
      weekdays.each do |day_name, day_number|
        if message.include?(day_name)
          days_ahead = day_number - today.wday
          days_ahead += 7 if days_ahead <= 0
          return today + days_ahead.days
        end
      end

      # Datas no formato dd/mm/yyyy ou dd/mm
      date_patterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})\/(\d{1,2})/
      ]

      date_patterns.each do |pattern|
        match = message.match(pattern)
        if match
          day = match[1].to_i
          month = match[2].to_i
          year = match[3] ? match[3].to_i : today.year
          
          # Se o mês já passou, assumir próximo ano
          year += 1 if month < today.month || (month == today.month && day < today.day)
          
          begin
            return Date.new(year, month, day)
          rescue ArgumentError
            next
          end
        end
      end

      # Próxima semana
      if message.include?('próxima semana') || message.include?('proxima semana') || message.include?('next week')
        return today + 7.days
      end

      nil
    end

    def extract_time
      # Padrões de horário: 14h, 14:00, 2pm, etc.
      time_patterns = [
        /(\d{1,2})[h:]\s*(\d{2})?/i,
        /(\d{1,2})\s*(am|pm)/i,
        /às\s*(\d{1,2})[h:]?/i,
        /(\d{1,2})\s*horas?/i
      ]

      time_patterns.each do |pattern|
        match = message.match(pattern)
        if match
          hour = match[1].to_i
          minute = match[2] ? match[2].to_i : 0
          
          # Converter PM
          if match[3]&.downcase == 'pm' && hour < 12
            hour += 12
          end
          
          # Validar horário
          if hour.between?(0, 23) && minute.between?(0, 59)
            return "#{hour.to_s.rjust(2, '0')}:#{minute.to_s.rjust(2, '0')}"
          end
        end
      end

      nil
    end

    def extract_client_name
      # Tentar extrair nome após palavras-chave
      name_patterns = [
        /(?:meu nome é|eu sou|sou o|sou a|me chamo|chamo-me)\s+([a-záàâãéêíóôõúç\s]+)/i,
        /nome:\s*([a-záàâãéêíóôõúç\s]+)/i
      ]

      name_patterns.each do |pattern|
        match = message.match(pattern)
        if match
          name = match[1].strip
          return name if name.length.between?(2, 50)
        end
      end

      nil
    end

    def extract_phone
      # Extrair telefone (formato brasileiro)
      phone_pattern = /(\+?55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})/
      match = message.match(phone_pattern)
      return match[0].gsub(/\D/, '') if match
      
      nil
    end

    def extract_confirmation
      confirmation_keywords = ['sim', 'yes', 'confirmo', 'confirmar', 'ok', 'okay', 'pode ser', 'tudo bem']
      denial_keywords = ['não', 'no', 'nao', 'cancelar', 'cancel', 'desistir']
      
      return true if confirmation_keywords.any? { |keyword| message.include?(keyword) }
      return false if denial_keywords.any? { |keyword| message.include?(keyword) }
      
      nil
    end

    def scheduling_keywords
      ['agendar', 'marcar', 'agendamento', 'horário', 'horario', 'schedule', 'appointment', 'marcação', 'marcacao']
    end

    def cancel_keywords
      ['cancelar', 'cancel', 'desmarcar', 'desistir', 'não quero', 'nao quero']
    end

    def list_keywords
      ['serviços', 'servicos', 'services', 'preços', 'precos', 'preço', 'preco', 'lista', 'list']
    end

    def query_keywords
      ['quando', 'quanto', 'horário', 'horario', 'disponível', 'disponivel', 'tem', 'tenho']
    end
  end
end

