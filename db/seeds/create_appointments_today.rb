# frozen_string_literal: true

# Script para criar agendamentos para hoje ou amanhã
# Execute: bin/rails runner db/seeds/create_appointments_today.rb

puts "\n=== Criando agendamentos para hoje/amanhã ==="

# Buscar a conta principal
account = Account.first
unless account
  puts "❌ Erro: Nenhuma conta encontrada."
  exit
end

# Buscar profissionais
professionals = AccountUser.where(account: account).includes(:user).to_a
if professionals.empty?
  puts "❌ Erro: Nenhum profissional encontrado."
  exit
end

# Buscar serviços
services = Service.where(account: account).to_a
if services.empty?
  puts "❌ Erro: Nenhum serviço encontrado."
  exit
end

# Buscar contatos
contacts = Contact.where(account: account).to_a
if contacts.empty?
  puts "❌ Erro: Nenhum contato encontrado."
  exit
end

# Usar hoje ou amanhã (garantindo que seja dia útil)
base_date = Date.today
if base_date.sunday?
  base_date = base_date + 1.day # Segunda-feira
elsif base_date.saturday?
  base_date = base_date + 2.days # Segunda-feira
end

puts "  📅 Data: #{base_date.strftime('%d/%m/%Y')} (#{I18n.t('date.day_names')[base_date.wday]})"

# Configurar horários de trabalho se necessário
professionals.each do |professional|
  if professional.schedule.blank?
    default_schedule = AccountUser::DEFAULT_SCHEDULE.deep_dup
    default_schedule.each do |day, config|
      if config[:enabled]
        default_schedule[day] = { enabled: true, start_hour: 8, end_hour: 18 }
      end
    end
    professional.update_column(:schedule, default_schedule)
  end
end

# Criar agendamentos
total_created = 0
available_slots = []
(8..17).each do |hour|
  [0, 30].each do |minute|
    available_slots << { hour: hour, minute: minute }
  end
end

professionals.each do |professional|
  day_name = base_date.strftime('%A').downcase.to_sym
  working_hours = professional.working_hours_for_day(day_name)
  
  unless working_hours[:enabled]
    puts "  ⚠️  #{professional.user.first_name} não trabalha neste dia. Pulando..."
    next
  end
  
  # Criar 4-6 agendamentos por profissional
  appointments_count = rand(4..6)
  created_for_prof = 0
  
  slots_to_use = available_slots.shuffle.take(appointments_count * 2)
  
  slots_to_use.each do |slot|
    break if created_for_prof >= appointments_count
    
    start_time = base_date.beginning_of_day + slot[:hour].hours + slot[:minute].minutes
    
    # Verificar se está dentro do horário de trabalho
    unless professional.available_at?(start_time)
      next
    end
    
    service = services.sample
    contact = contacts.sample
    
    duration_minutes = service.metadata&.dig('duration_minutes') || service.metadata&.dig(:duration_minutes) || 30
    end_time = start_time + duration_minutes.minutes
    
    end_check_time = end_time - 1.minute
    unless professional.available_at?(end_check_time)
      next
    end
    
    # Verificar conflitos
    existing = Appointment.where(
      account: account,
      account_user: professional
    ).where.not(status: Appointment::APPOINTMENT_STATUS[:canceled]).where(
      '(start_time < ? AND end_time > ?)',
      end_time, start_time
    ).exists?
    
    next if existing
    
    begin
      appointment = Appointment.create!(
        account: account,
        account_user: professional,
        service: service,
        contact: contact,
        start_time: start_time,
        end_time: end_time,
        whatsapp_number: contact.cell_phone_number,
        price_cents: service.selling_price_cents,
        price_currency: 'BRL',
        status: [:pending, :confirmed, :completed].sample,
        payment_status: [:pending, :paid].sample
      )
      
      created_for_prof += 1
      total_created += 1
      puts "  ✓ #{professional.user.first_name}: #{start_time.strftime('%H:%M')} - #{service.name} (#{contact.first_name})"
    rescue => e
      puts "  ✗ Erro: #{e.message}"
      next
    end
  end
end

puts "\n✅ Criados #{total_created} agendamentos para #{base_date.strftime('%d/%m/%Y')}"
puts "   Total na conta: #{Appointment.where(account: account).count}"


