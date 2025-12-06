# frozen_string_literal: true

module WhatsApp
  class ResponseBuilder
    attr_reader :intent, :account, :parsed_data, :result

    def initialize(intent:, account:, parsed_data: {}, result: {})
      @intent = intent
      @account = account
      @parsed_data = parsed_data
      @result = result
    end

    def build
      case intent
      when :schedule
        build_schedule_response
      when :list_services
        build_services_list_response
      when :cancel
        build_cancel_response
      when :query
        build_query_response
      else
        build_default_response
      end
    end

    private

    def build_schedule_response
      if result[:success]
        result[:message] || "✅ Agendamento criado com sucesso!"
      else
        "❌ #{result[:error]}\n\n" \
        "Por favor, envie uma mensagem no formato:\n" \
        "Agendar [serviço] para [data] às [horário]\n\n" \
        "Exemplo: Agendar corte de cabelo para amanhã às 14h"
      end
    end

    def build_services_list_response
      services = account.services.where(enabled: 't').limit(10)
      
      if services.empty?
        "Não há serviços disponíveis no momento."
      else
        message = "📋 *Serviços Disponíveis:*\n\n"
        services.each_with_index do |service, index|
          price = format_currency(service.selling_price_cents)
          message += "#{index + 1}. #{service.name} - #{price}\n"
        end
        message += "\nPara agendar, envie: Agendar [nome do serviço] para [data] às [horário]"
        message
      end
    end

    def build_cancel_response
      "Para cancelar um agendamento, por favor informe o número do agendamento ou a data."
    end

    def build_query_response
      if parsed_data[:date]
        # Verificar disponibilidade na data
        date = parsed_data[:date]
        available_slots = get_available_slots(date)
        
        if available_slots.any?
          message = "📅 *Horários disponíveis para #{date.strftime('%d/%m/%Y')}:*\n\n"
          available_slots.each do |slot|
            message += "⏰ #{slot}\n"
          end
          message
        else
          "Não há horários disponíveis para #{date.strftime('%d/%m/%Y')}."
        end
      else
        "Por favor, informe a data que deseja consultar."
      end
    end

    def build_default_response
      "👋 Olá! Como posso ajudar?\n\n" \
      "Você pode:\n" \
      "• Agendar um serviço\n" \
      "• Ver serviços disponíveis\n" \
      "• Consultar horários\n" \
      "• Cancelar agendamento\n\n" \
      "Exemplo: Agendar corte de cabelo para amanhã às 14h"
    end

    def get_available_slots(date)
      # Horários padrão: 9h às 18h, de hora em hora
      slots = []
      start_hour = 9
      end_hour = 18
      
      (start_hour..end_hour).each do |hour|
        slot_time = Time.zone.parse("#{date} #{hour}:00")
        slots << slot_time.strftime('%H:%M') if slot_time > Time.current
      end
      
      slots
    end

    def format_currency(cents)
      return "R$ 0,00" if cents.nil? || cents.zero?
      "R$ #{format('%.2f', cents / 100.0).gsub('.', ',')}"
    end
  end
end

