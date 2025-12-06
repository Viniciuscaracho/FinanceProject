# frozen_string_literal: true

# Seed de dados de demonstração para todas as funcionalidades do sistema
# Execute com: rails runner db/seeds/demo_data.rb

puts "\n" + "="*80
puts "🌱 CRIANDO DADOS DE DEMONSTRAÇÃO PARA O SISTEMA"
puts "="*80

# Garantir que temos uma conta
account = Account.first
unless account
  puts "❌ ERRO: Nenhuma conta encontrada. Execute db:seed primeiro!"
  exit
end

puts "\n📋 Conta: #{account.id} - #{account.company&.name || 'Sem nome'}"

# ============================================================================
# 1. PROFISSIONAIS (ACCOUNT_USERS)
# ============================================================================
puts "\n" + "-"*80
puts "👥 Criando Profissionais..."
puts "-"*80

professionals_data = [
  {
    first_name: "Carlos",
    last_name: "Silva",
    email: "carlos.silva@salon.com",
    phone_number: "(11) 98765-4321",
    role: :custom
  },
  {
    first_name: "Ana",
    last_name: "Santos",
    email: "ana.santos@salon.com",
    phone_number: "(11) 98765-4322",
    role: :custom
  },
  {
    first_name: "Roberto",
    last_name: "Oliveira",
    email: "roberto.oliveira@salon.com",
    phone_number: "(11) 98765-4323",
    role: :custom
  },
  {
    first_name: "Mariana",
    last_name: "Costa",
    email: "mariana.costa@salon.com",
    phone_number: "(11) 98765-4324",
    role: :custom
  }
]

professionals = []
professionals_data.each do |prof_data|
  user = User.find_by(email: prof_data[:email])
  
  unless user
    # Associar usuário à conta existente antes de criar para evitar criação de conta padrão
    user = User.new(
      email: prof_data[:email],
      first_name: prof_data[:first_name],
      last_name: prof_data[:last_name],
      phone_number: prof_data[:phone_number],
      password: "password123",
      password_confirmation: "password123",
      confirmed_at: Time.current,
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current,
      terms_of_service: '1', # Aceitar termos
      preferred_language: 'pt-BR',
      account: account # Associar à conta existente
    )
    user.skip_confirmation! # Pular confirmação do Devise
    user.save!
    puts "  ✅ Usuário criado: #{user.name} (#{user.email})"
  else
    puts "  ℹ️  Usuário já existe: #{user.name} (#{user.email})"
  end

  account_user = AccountUser.find_or_initialize_by(account: account, user: user)
  if account_user.new_record?
    account_user.role = prof_data[:role]
    account_user.save!
    puts "  ✅ Profissional adicionado à conta: #{user.name}"
  else
    puts "  ℹ️  Profissional já está na conta: #{user.name}"
  end
  
  professionals << account_user
end

puts "  📊 Total de profissionais: #{professionals.count}"

# ============================================================================
# 2. SERVIÇOS
# ============================================================================
puts "\n" + "-"*80
puts "✂️  Criando Serviços..."
puts "-"*80

services_data = [
  {
    name: "Corte de Cabelo Masculino",
    description: "Corte moderno e estiloso para homens",
    selling_price_cents: 5000, # R$ 50,00
    cost_price_cents: 2000,    # R$ 20,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Corte de Cabelo Feminino",
    description: "Corte e escova para mulheres",
    selling_price_cents: 8000, # R$ 80,00
    cost_price_cents: 3000,    # R$ 30,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Coloração Completa",
    description: "Coloração completa com produtos premium",
    selling_price_cents: 15000, # R$ 150,00
    cost_price_cents: 6000,      # R$ 60,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Mechas",
    description: "Aplicação de mechas californianas",
    selling_price_cents: 20000, # R$ 200,00
    cost_price_cents: 8000,     # R$ 80,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Barba",
    description: "Aparar e modelar barba",
    selling_price_cents: 3000, # R$ 30,00
    cost_price_cents: 1000,    # R$ 10,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Sobrancelha",
    description: "Design de sobrancelhas",
    selling_price_cents: 2500, # R$ 25,00
    cost_price_cents: 800,      # R$ 8,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Hidratação",
    description: "Tratamento hidratante profundo",
    selling_price_cents: 6000, # R$ 60,00
    cost_price_cents: 2500,     # R$ 25,00
    unit: "unidade",
    enabled: 't'
  },
  {
    name: "Escova Progressiva",
    description: "Alisamento com escova progressiva",
    selling_price_cents: 25000, # R$ 250,00
    cost_price_cents: 10000,    # R$ 100,00
    unit: "unidade",
    enabled: 't'
  }
]

services = []
services_data.each do |service_data|
  service = account.services.find_or_initialize_by(name: service_data[:name])
  
  if service.new_record?
    service.assign_attributes(
      offer_type_cd: Service::SERVICE_TYPES[:provided],
      description: service_data[:description],
      selling_price_cents: service_data[:selling_price_cents],
      cost_price_cents: service_data[:cost_price_cents],
      unit: service_data[:unit],
      enabled: service_data[:enabled],
      currency: 'BRL'
    )
    service.save!
    puts "  ✅ Serviço criado: #{service.name} - R$ #{service_data[:selling_price_cents] / 100.0}"
  else
    puts "  ℹ️  Serviço já existe: #{service.name}"
  end
  
  services << service
end

puts "  📊 Total de serviços: #{services.count}"

# ============================================================================
# 3. CONTATOS/CLIENTES
# ============================================================================
puts "\n" + "-"*80
puts "👤 Criando Contatos/Clientes..."
puts "-"*80

contacts_data = [
  {
    first_name: "João",
    last_name: "Pereira",
    email: "joao.pereira@email.com",
    phone_number: "(11) 91234-5678",
    whatsapp_number: "5511912345678"
  },
  {
    first_name: "Maria",
    last_name: "Ferreira",
    email: "maria.ferreira@email.com",
    phone_number: "(11) 91234-5679",
    whatsapp_number: "5511912345679"
  },
  {
    first_name: "Pedro",
    last_name: "Almeida",
    email: "pedro.almeida@email.com",
    phone_number: "(11) 91234-5680",
    whatsapp_number: "5511912345680"
  },
  {
    first_name: "Julia",
    last_name: "Rodrigues",
    email: "julia.rodrigues@email.com",
    phone_number: "(11) 91234-5681",
    whatsapp_number: "5511912345681"
  },
  {
    first_name: "Lucas",
    last_name: "Martins",
    email: "lucas.martins@email.com",
    phone_number: "(11) 91234-5682",
    whatsapp_number: "5511912345682"
  },
  {
    first_name: "Fernanda",
    last_name: "Lima",
    email: "fernanda.lima@email.com",
    phone_number: "(11) 91234-5683",
    whatsapp_number: "5511912345683"
  },
  {
    first_name: "Rafael",
    last_name: "Souza",
    email: "rafael.souza@email.com",
    phone_number: "(11) 91234-5684",
    whatsapp_number: "5511912345684"
  },
  {
    first_name: "Camila",
    last_name: "Barbosa",
    email: "camila.barbosa@email.com",
    phone_number: "(11) 91234-5685",
    whatsapp_number: "5511912345685"
  }
]

contacts = []
contacts_data.each do |contact_data|
  contact = account.contacts.find_or_initialize_by(email: contact_data[:email])
  
  if contact.new_record?
    contact.assign_attributes(
      first_name: contact_data[:first_name],
      last_name: contact_data[:last_name],
      phone_number: contact_data[:phone_number],
      email: contact_data[:email],
      person_type: contact_data[:person_type] || :natural,
      contact_type: :customer
    )
    contact.save!
    puts "  ✅ Contato criado: #{contact.name} (#{contact.email})"
  else
    puts "  ℹ️  Contato já existe: #{contact.name} (#{contact.email})"
  end
  
  contacts << contact
end

puts "  📊 Total de contatos: #{contacts.count}"

# ============================================================================
# 4. AGENDAMENTOS
# ============================================================================
puts "\n" + "-"*80
puts "📅 Criando Agendamentos..."
puts "-"*80

# Criar agendamentos para os últimos 7 dias e próximos 7 dias (reduzido para performance)
start_date = 7.days.ago
end_date = 7.days.from_now

appointments_created = 0
total_days = (end_date - start_date).to_i
current_day = 0

# Gerar agendamentos variados
(0..total_days).each do |day_offset|
  date = start_date + day_offset.days
  next if date.sunday? # Pular domingos
  
  current_day += 1
  if current_day % 3 == 0
    puts "  ⏳ Processando dia #{current_day}/#{total_days}..."
  end
  
  # Criar 1-2 agendamentos por dia (reduzido)
  appointments_per_day = rand(1..2)
  
  appointments_per_day.times do
    professional = professionals.sample
    service = services.sample
    contact = contacts.sample
    
    # Horários entre 9h e 17h, de hora em hora
    hour = rand(9..16)
    minute = [0, 30].sample
    start_time = date.beginning_of_day + hour.hours + minute.minutes
    end_time = start_time + 1.hour
    
    # Variar status (usar valores do enum)
    statuses = [
      Appointment::APPOINTMENT_STATUS[:pending],
      Appointment::APPOINTMENT_STATUS[:confirmed],
      Appointment::APPOINTMENT_STATUS[:completed]
    ]
    weights = [20, 40, 40] # Mais confirmados e completos
    status_value = statuses.zip(weights).flat_map { |s, w| [s] * w }.sample
    
    payment_status_value = if status_value == Appointment::APPOINTMENT_STATUS[:confirmed] || 
                              status_value == Appointment::APPOINTMENT_STATUS[:completed]
      Appointment::PAYMENT_STATUS[:paid]
    else
      Appointment::PAYMENT_STATUS[:pending]
    end
    
    # Verificar se já existe agendamento neste horário para este profissional (simplificado)
    existing = Appointment.unscoped.where(
      account_id: account.id,
      account_user_id: professional.id
    ).where(
      'start_time BETWEEN ? AND ? OR end_time BETWEEN ? AND ?',
      start_time - 1.hour, end_time + 1.hour,
      start_time - 1.hour, end_time + 1.hour
    ).where.not(status: Appointment::APPOINTMENT_STATUS[:canceled]).exists?
    
    next if existing # Pular se já existe conflito
    
    # Criar agendamento (usar status e payment_status com valores numéricos)
    appointment = Appointment.new(
      account_id: account.id,
      account_user_id: professional.id,
      service_id: service.id,
      start_time: start_time,
      end_time: end_time,
      price_cents: service.selling_price_cents,
      price_currency: 'BRL',
      status: status_value,
      payment_status: payment_status_value,
      whatsapp_number: (contact&.phone_number&.gsub(/\D/, '') || contact&.cell_phone_number&.gsub(/\D/, '') || "5511999999999"),
      contact: contact
    )
    
    if appointment.save
      appointments_created += 1
      
      # Criar comissão se estiver confirmado ou completo
      if appointment.status == Appointment::APPOINTMENT_STATUS[:confirmed] || 
         appointment.status == Appointment::APPOINTMENT_STATUS[:completed]
        commission_percentage = 50.0 # 50% de comissão
        commission_amount_cents = (appointment.price_cents * commission_percentage / 100).round
        
        # Criar comissão apenas se não existir
        unless AppointmentCommission.exists?(appointment_id: appointment.id, account_user_id: professional.id)
          AppointmentCommission.create!(
            appointment_id: appointment.id,
            account_user_id: professional.id,
            commission_type: :percentage,
            commission_value: commission_percentage,
            commission_amount_cents: commission_amount_cents
          )
        end
      end
    end
  end
end

puts "  ✅ Agendamentos criados: #{appointments_created}"
puts "  📊 Total de agendamentos na conta: #{Appointment.unscoped.where(account_id: account.id).count}"

# ============================================================================
# RESUMO FINAL
# ============================================================================
puts "\n" + "="*80
puts "✅ DADOS DE DEMONSTRAÇÃO CRIADOS COM SUCESSO!"
puts "="*80
puts "\n📊 RESUMO:"
puts "  👥 Profissionais: #{professionals.count}"
puts "  ✂️  Serviços: #{services.count}"
puts "  👤 Contatos: #{contacts.count}"
appointments_count = Appointment.unscoped.where(account_id: account.id).count
confirmed_count = Appointment.unscoped.where(account_id: account.id, status: Appointment::APPOINTMENT_STATUS[:confirmed]).count
completed_count = Appointment.unscoped.where(account_id: account.id, status: Appointment::APPOINTMENT_STATUS[:completed]).count
pending_count = Appointment.unscoped.where(account_id: account.id, status: Appointment::APPOINTMENT_STATUS[:pending]).count

puts "  📅 Agendamentos: #{appointments_count}"
puts "  💰 Agendamentos Confirmados: #{confirmed_count}"
puts "  ✅ Agendamentos Completos: #{completed_count}"
puts "  ⏳ Agendamentos Pendentes: #{pending_count}"
puts "\n🎉 Pronto para testar todas as funcionalidades!"
puts "="*80

