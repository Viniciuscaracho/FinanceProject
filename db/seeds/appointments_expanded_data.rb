# frozen_string_literal: true

# Seeds expandidos para dados de agendamentos
# Cria mais profissionais e agendamentos no mesmo dia para cada profissional

puts "\n=== Criando dados expandidos de agendamentos ==="

# Buscar a conta principal
account = Account.first
unless account
  puts "❌ Erro: Nenhuma conta encontrada. Execute primeiro: bin/rails db:seed"
  exit
end

# --- 1. CRIAR MAIS PROFISSIONAIS (CABELEIREIROS) ---
puts "\n1. Criando profissionais adicionais..."

professionals_data = [
  { email: 'carlos@barbershop.com', first_name: 'Carlos', last_name: 'Mendes', role: :member },
  { email: 'lucas@barbershop.com', first_name: 'Lucas', last_name: 'Ferreira', role: :member },
  { email: 'rafael@barbershop.com', first_name: 'Rafael', last_name: 'Almeida', role: :member },
  { email: 'bruno@barbershop.com', first_name: 'Bruno', last_name: 'Rodrigues', role: :member },
  { email: 'felipe@barbershop.com', first_name: 'Felipe', last_name: 'Martins', role: :member },
  { email: 'gabriel@barbershop.com', first_name: 'Gabriel', last_name: 'Lima', role: :member },
  { email: 'ricardo@barbershop.com', first_name: 'Ricardo', last_name: 'Souza', role: :member },
  { email: 'thiago@barbershop.com', first_name: 'Thiago', last_name: 'Barbosa', role: :member }
]

professionals = []
professionals_data.each do |prof_data|
  user = User.find_or_create_by!(email: prof_data[:email]) do |u|
    u.password = 'password123'
    u.password_confirmation = 'password123'
    u.first_name = prof_data[:first_name]
    u.last_name = prof_data[:last_name]
    u.skip_confirmation!
    u.accepted_terms_at = Time.current
    u.accepted_privacy_at = Time.current
  end
  
  # Garantir que os termos foram aceitos
  if user.accepted_terms_at.nil? || user.accepted_privacy_at.nil?
    user.update!(
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current
    )
  end

  account_user = AccountUser.find_or_create_by!(account: account, user: user) do |au|
    au.role_cd = AccountUser::ROLES[prof_data[:role]]
  end

  professionals << account_user
  puts "  ✓ Profissional: #{user.first_name} #{user.last_name} (#{user.email})"
end

# Buscar profissionais existentes também
existing_professionals = AccountUser.where(account: account).where.not(id: professionals.map(&:id))
all_professionals = professionals + existing_professionals.to_a

puts "\n   Total de profissionais: #{all_professionals.count}"

# --- 2. BUSCAR/CRIAR SERVIÇOS ---
puts "\n2. Buscando serviços..."

services = Service.where(account: account).to_a
if services.empty?
  puts "  ⚠️  Nenhum serviço encontrado. Criando serviços básicos..."
  
  services_data = [
    { name: 'Corte Masculino', description: 'Corte de cabelo masculino tradicional', selling_price_cents: 3000, duration_minutes: 30 },
    { name: 'Corte + Barba', description: 'Corte de cabelo e barba', selling_price_cents: 5000, duration_minutes: 45 },
    { name: 'Barba', description: 'Aparar e modelar barba', selling_price_cents: 2000, duration_minutes: 20 },
    { name: 'Corte Feminino', description: 'Corte de cabelo feminino', selling_price_cents: 4000, duration_minutes: 40 }
  ]
  
  services_data.each do |service_data|
    service = Service.find_or_create_by!(account: account, name: service_data[:name]) do |s|
      s.description = service_data[:description]
      s.selling_price_cents = service_data[:selling_price_cents]
      s.currency = 'BRL'
      s.offer_type_cd = Service::SERVICE_TYPES[:provided]
      s.enabled = 't'
      s.metadata = { duration_minutes: service_data[:duration_minutes] }
    end
    services << service
  end
end

puts "  ✓ #{services.count} serviços disponíveis"

# --- 3. CRIAR MAIS CONTATOS (CLIENTES) ---
puts "\n3. Criando contatos de clientes adicionais..."

contacts_data = [
  { first_name: 'André', last_name: 'Silva', cell_phone: '11912345678', email: 'andre@email.com' },
  { first_name: 'Beatriz', last_name: 'Costa', cell_phone: '11923456789', email: 'beatriz@email.com' },
  { first_name: 'Daniel', last_name: 'Oliveira', cell_phone: '11934567890', email: 'daniel@email.com' },
  { first_name: 'Eduarda', last_name: 'Santos', cell_phone: '11945678901', email: 'eduarda@email.com' },
  { first_name: 'Fábio', last_name: 'Pereira', cell_phone: '11956789012', email: 'fabio@email.com' },
  { first_name: 'Giovanna', last_name: 'Lima', cell_phone: '11967890123', email: 'giovanna@email.com' },
  { first_name: 'Henrique', last_name: 'Alves', cell_phone: '11978901234', email: 'henrique@email.com' },
  { first_name: 'Isabela', last_name: 'Ferreira', cell_phone: '11989012345', email: 'isabela@email.com' },
  { first_name: 'Jorge', last_name: 'Martins', cell_phone: '11990123456', email: 'jorge@email.com' },
  { first_name: 'Karina', last_name: 'Rodrigues', cell_phone: '11901234567', email: 'karina@email.com' },
  { first_name: 'Leonardo', last_name: 'Souza', cell_phone: '11912345098', email: 'leonardo@email.com' },
  { first_name: 'Mariana', last_name: 'Barbosa', cell_phone: '11923450987', email: 'mariana@email.com' },
  { first_name: 'Nicolas', last_name: 'Mendes', cell_phone: '11934509876', email: 'nicolas@email.com' },
  { first_name: 'Patricia', last_name: 'Lima', cell_phone: '11945098765', email: 'patricia@email.com' },
  { first_name: 'Renato', last_name: 'Almeida', cell_phone: '11950987654', email: 'renato@email.com' },
  { first_name: 'Sandra', last_name: 'Ferreira', cell_phone: '11909876543', email: 'sandra@email.com' }
]

contacts = []
contacts_data.each do |contact_data|
  contact = Contact.find_or_create_by!(account: account, cell_phone_number: contact_data[:cell_phone]) do |c|
    c.first_name = contact_data[:first_name]
    c.last_name = contact_data[:last_name]
    c.email = contact_data[:email]
    c.contact_type_cd = Contact::CONTACT_TYPES[:customer]
  end

  contacts << contact
end

# Buscar contatos existentes também
existing_contacts = Contact.where(account: account).where.not(id: contacts.map(&:id))
all_contacts = contacts + existing_contacts.to_a

puts "  ✓ #{all_contacts.count} contatos disponíveis"

# --- 4. CONFIGURAR HORÁRIOS DE TRABALHO PARA OS PROFISSIONAIS ---
puts "\n4. Configurando horários de trabalho para os profissionais..."

# Configurar horários de trabalho (8h às 18h, segunda a sexta, sábado opcional)
all_professionals.each do |professional|
  # Garantir que o profissional tenha horários configurados
  if professional.schedule.blank?
    default_schedule = AccountUser::DEFAULT_SCHEDULE.deep_dup
    # Ajustar para 8h-18h (mais cedo para ter mais horários disponíveis)
    default_schedule.each do |day, config|
      if config[:enabled]
        default_schedule[day] = { enabled: true, start_hour: 8, end_hour: 18 }
      end
    end
    # Habilitar sábado para alguns profissionais
    if rand > 0.5
      default_schedule[:saturday] = { enabled: true, start_hour: 8, end_hour: 14 }
    end
    professional.update_column(:schedule, default_schedule)
  end
end

puts "  ✓ Horários de trabalho configurados"

# --- 5. CRIAR AGENDAMENTOS NO MESMO DIA PARA CADA PROFISSIONAL ---
puts "\n5. Criando agendamentos no mesmo dia para cada profissional..."

# Usar uma data próxima (hoje ou amanhã, garantindo que seja dia útil)
# Se hoje for sábado ou domingo, usar segunda-feira
base_date = Date.today
if base_date.sunday?
  base_date = base_date + 1.day # Segunda-feira
elsif base_date.saturday?
  base_date = base_date + 2.days # Segunda-feira
end

# Se hoje for dia útil, usar hoje mesmo (para garantir que apareçam)
# Caso contrário, usar o próximo dia útil

puts "  📅 Data base: #{base_date.strftime('%d/%m/%Y')} (#{I18n.t('date.day_names')[base_date.wday]})"

# Horários disponíveis (das 8h às 17h30, a cada 30 minutos)
# Considerando que serviços podem durar até 60 minutos
available_slots = []
(8..17).each do |hour|
  [0, 30].each do |minute|
    available_slots << { hour: hour, minute: minute }
  end
end

total_appointments_created = 0

all_professionals.each_with_index do |professional, prof_index|
  puts "\n  👤 Profissional: #{professional.user.first_name} #{professional.user.last_name}"
  
  # Verificar se o profissional trabalha neste dia
  day_name = base_date.strftime('%A').downcase.to_sym
  working_hours = professional.working_hours_for_day(day_name)
  
  unless working_hours[:enabled]
    puts "    ⚠️  Profissional não trabalha neste dia. Pulando..."
    next
  end
  
  # Criar 5-8 agendamentos por profissional no mesmo dia
  appointments_per_professional = rand(5..8)
  professional_appointments_created = 0
  
  # Usar slots sequenciais para evitar conflitos
  slots_to_use = available_slots.shuffle.take(appointments_per_professional * 2) # Pegar mais slots para ter opções
  
  slots_to_use.each do |slot|
    break if professional_appointments_created >= appointments_per_professional
    
    start_time = base_date.beginning_of_day + slot[:hour].hours + slot[:minute].minutes
    
    # Verificar se está dentro do horário de trabalho
    unless professional.available_at?(start_time)
      next
    end
    
    # Escolher serviço e contato aleatórios
    service = services.sample
    contact = all_contacts.sample
    
    # Calcular end_time baseado na duração do serviço
    duration_minutes = service.metadata&.dig('duration_minutes') || service.metadata&.dig(:duration_minutes) || 30
    end_time = start_time + duration_minutes.minutes
    
    # Verificar se o horário de fim também está dentro do horário de trabalho
    end_check_time = end_time - 1.minute
    unless professional.available_at?(end_check_time)
      next
    end
    
    # Verificar se já existe agendamento conflitante
    existing = Appointment.where(
      account: account,
      account_user: professional
    ).where.not(status: Appointment::APPOINTMENT_STATUS[:canceled]).where(
      '(start_time < ? AND end_time > ?)',
      end_time, start_time
    ).exists?
    
    next if existing # Pular se já existe conflito
    
    # Criar agendamento
    begin
      # Status e payment_status variados
      statuses = [:pending, :confirmed, :completed]
      payment_statuses = [:pending, :paid]
      
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
        status: statuses.sample,
        payment_status: payment_statuses.sample
      )
      
      professional_appointments_created += 1
      total_appointments_created += 1
      puts "    ✓ #{start_time.strftime('%H:%M')} - #{end_time.strftime('%H:%M')} | #{appointment.service.name} | #{appointment.contact.first_name} | #{appointment.status}"
    rescue ActiveRecord::RecordInvalid => e
      # Se houver erro de validação, mostrar e continuar
      puts "    ✗ Erro ao criar: #{e.message}"
      next
    end
  end
  
  puts "    📊 Total para este profissional: #{professional_appointments_created} agendamentos"
end

puts "\n✅ Dados expandidos criados com sucesso!"
puts "   - #{all_professionals.count} profissionais"
puts "   - #{services.count} serviços"
puts "   - #{all_contacts.count} contatos"
puts "   - #{total_appointments_created} novos agendamentos criados"

current_year = Date.today.year
puts "\n📊 Estatísticas:"
puts "   - Total de agendamentos na conta: #{Appointment.where(account: account).count}"
puts "   - Agendamentos em #{base_date.strftime('%d/%m/%Y')}: #{Appointment.where(account: account, start_time: base_date.beginning_of_day..base_date.end_of_day).count}"
puts "   - Agendamentos por profissional em #{base_date.strftime('%d/%m/%Y')}:"
all_professionals.each do |prof|
  count = Appointment.where(
    account: account,
    account_user: prof,
    start_time: base_date.beginning_of_day..base_date.end_of_day
  ).count
  puts "     • #{prof.user.first_name} #{prof.user.last_name}: #{count} agendamentos"
end

