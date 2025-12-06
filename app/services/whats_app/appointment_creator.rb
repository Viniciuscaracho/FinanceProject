# frozen_string_literal: true

module WhatsApp
  class AppointmentCreator
    attr_reader :account, :parsed_data, :whatsapp_number

    def initialize(account:, parsed_data:, whatsapp_number:)
      @account = account
      @parsed_data = parsed_data
      @whatsapp_number = whatsapp_number
    end

    def create
      # Validar dados mínimos
      return error_response('Serviço não encontrado') unless parsed_data[:service]
      return error_response('Data não informada') unless parsed_data[:date]
      return error_response('Horário não informado') unless parsed_data[:time]

      # Buscar ou criar contato
      contact = find_or_create_contact

      # Buscar serviço
      service = account.services.find_by(id: parsed_data[:service][:id])
      return error_response('Serviço não encontrado') unless service

      # Buscar profissional padrão (primeiro disponível)
      professional = account.account_users.first
      return error_response('Nenhum profissional disponível') unless professional

      # Calcular preço
      price_cents = parsed_data[:price] || service.selling_price_cents || 0
      return error_response('Preço não informado') if price_cents.zero?

      # Criar data/hora
      date = parsed_data[:date]
      time_str = parsed_data[:time]
      hour, minute = time_str.split(':').map(&:to_i)
      
      start_time = Time.zone.parse("#{date} #{hour}:#{minute}")
      end_time = start_time + (service.data['duration_minutes']&.to_i || 60).minutes

      # Verificar conflitos
      if has_conflict?(professional, start_time, end_time)
        return error_response('Horário já ocupado. Por favor, escolha outro horário.')
      end

      # Criar agendamento
      appointment = account.appointments.build(
        account_user: professional,
        service: service,
        contact: contact,
        whatsapp_number: whatsapp_number,
        start_time: start_time,
        end_time: end_time,
        price_cents: price_cents,
        price_currency: 'BRL',
        status: :pending,
        payment_status: :pending
      )

      if appointment.save
        # Criar transação automaticamente
        create_transaction(appointment, service, contact, price_cents)
        
        success_response(appointment)
      else
        error_response(appointment.errors.full_messages.join(', '))
      end
    rescue StandardError => e
      Rails.logger.error "Error creating appointment: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      error_response("Erro ao criar agendamento: #{e.message}")
    end

    private

    def find_or_create_contact
      phone = whatsapp_number.gsub(/\D/, '')
      
      contact = account.contacts.find_by(cell_phone_number: phone)
      
      unless contact
        name = parsed_data[:client_name] || "Cliente #{whatsapp_number}"
        contact = account.contacts.create!(
          first_name: name.split.first,
          last_name: name.split[1..-1]&.join(' '),
          cell_phone_number: phone,
          contact_type_cd: Contact::CONTACT_TYPES[:customer]
        )
      end

      contact
    end

    def has_conflict?(professional, start_time, end_time)
      account.appointments
             .where(account_user: professional)
             .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])
             .where(
               '(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?)',
               end_time, start_time,
               start_time, end_time
             )
             .exists?
    end

    def create_transaction(appointment, service, contact, price_cents)
      bank_account = account.bank_accounts.default.first || account.bank_accounts.first
      return unless bank_account

      Transaction.create!(
        account: account,
        bank_account: bank_account,
        contact: contact,
        service: service,
        transaction_type_cd: Transaction::TRANSACTION_TYPES[:revenue],
        amount_cents: price_cents,
        amount_currency: 'BRL',
        due_date: appointment.start_time.to_date,
        payment_method_cd: Transaction::PAYMENT_METHOD[:no_payment_method],
        payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash],
        paid: false, # Será marcado como pago quando confirmar
        description: "Agendamento: #{service.name} - #{contact.first_name}",
        name: "Agendamento #{service.name}"
      )
    end

    def success_response(appointment)
      {
        success: true,
        appointment: appointment,
        message: format_confirmation_message(appointment)
      }
    end

    def error_response(message)
      {
        success: false,
        error: message
      }
    end

    def format_confirmation_message(appointment)
      service_name = appointment.service.name
      date = appointment.start_time.strftime('%d/%m/%Y')
      time = appointment.start_time.strftime('%H:%M')
      price = format_currency(appointment.price_cents)
      
      "✅ Agendamento confirmado!\n\n" \
      "📅 Data: #{date}\n" \
      "⏰ Horário: #{time}\n" \
      "💇 Serviço: #{service_name}\n" \
      "💰 Valor: #{price}\n\n" \
      "Aguardamos você!"
    end

    def format_currency(cents)
      "R$ #{format('%.2f', cents / 100.0).gsub('.', ',')}"
    end
  end
end

