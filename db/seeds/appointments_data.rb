# frozen_string_literal: true

# Seeds para dados de agendamentos (profissionais, serviços, contatos e agendamentos)

puts "\n=== Criando dados de agendamentos ==="

# Buscar a conta principal
account = Account.first
unless account
  puts "❌ Erro: Nenhuma conta encontrada. Execute primeiro: bin/rails db:seed"
  exit
end

# --- 1. CRIAR PROFISSIONAIS (CABELEIREIROS) ---
puts "\n1. Criando profissionais..."

professionals_data = [
  { email: 'joao@barbershop.com', first_name: 'João', last_name: 'Silva', role: :member },
  { email: 'maria@barbershop.com', first_name: 'Maria', last_name: 'Santos', role: :member },
  { email: 'pedro@barbershop.com', first_name: 'Pedro', last_name: 'Oliveira', role: :member },
  { email: 'ana@barbershop.com', first_name: 'Ana', last_name: 'Costa', role: :member }
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

# --- 2. CRIAR SERVIÇOS ---
puts "\n2. Criando serviços..."

services_data = [
  { name: 'Corte Masculino', description: 'Corte de cabelo masculino tradicional', selling_price_cents: 3000, duration_minutes: 30 },
  { name: 'Corte + Barba', description: 'Corte de cabelo e barba', selling_price_cents: 5000, duration_minutes: 45 },
  { name: 'Barba', description: 'Aparar e modelar barba', selling_price_cents: 2000, duration_minutes: 20 },
  { name: 'Corte Feminino', description: 'Corte de cabelo feminino', selling_price_cents: 4000, duration_minutes: 40 },
  { name: 'Corte + Sobrancelha', description: 'Corte de cabelo e design de sobrancelha', selling_price_cents: 3500, duration_minutes: 35 }
]

services = []
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
  puts "  ✓ Serviço: #{service.name} - R$ #{Money.new(service.selling_price_cents, 'BRL').format}"
end

# --- 3. CRIAR CONTATOS (CLIENTES) ---
puts "\n3. Criando contatos de clientes..."

contacts_data = [
  { first_name: 'Carlos', last_name: 'Pereira', cell_phone: '11987654321', email: 'carlos@email.com' },
  { first_name: 'Fernanda', last_name: 'Lima', cell_phone: '11976543210', email: 'fernanda@email.com' },
  { first_name: 'Roberto', last_name: 'Alves', cell_phone: '11965432109', email: 'roberto@email.com' },
  { first_name: 'Juliana', last_name: 'Ferreira', cell_phone: '11954321098', email: 'juliana@email.com' }
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
  puts "  ✓ Contato: #{contact.first_name} #{contact.last_name} (#{contact.cell_phone_number})"
end

# --- 4. CRIAR AGENDAMENTOS DE EXEMPLO ---
puts "\n4. Criando agendamentos de exemplo..."

# Agendamentos confirmados (já pagos)
confirmed_appointments = [
  {
    professional: professionals[0],
    service: services[0],
    contact: contacts[0],
    start_time: 2.days.ago.beginning_of_day + 10.hours,
    whatsapp_number: contacts[0].cell_phone_number,
    status: :confirmed,
    payment_status: :paid
  },
  {
    professional: professionals[1],
    service: services[1],
    contact: contacts[1],
    start_time: 1.day.ago.beginning_of_day + 14.hours,
    whatsapp_number: contacts[1].cell_phone_number,
    status: :confirmed,
    payment_status: :paid
  },
  {
    professional: professionals[0],
    service: services[2],
    contact: contacts[2],
    start_time: 3.days.ago.beginning_of_day + 15.hours,
    whatsapp_number: contacts[2].cell_phone_number,
    status: :confirmed,
    payment_status: :paid
  }
]

# Agendamentos pendentes (aguardando pagamento)
pending_appointments = [
  {
    professional: professionals[2],
    service: services[3],
    contact: contacts[3],
    start_time: 2.days.from_now.beginning_of_day + 11.hours,
    whatsapp_number: contacts[3].cell_phone_number,
    status: :pending,
    payment_status: :pending
  },
  {
    professional: professionals[1],
    service: services[0],
    contact: contacts[0],
    start_time: 3.days.from_now.beginning_of_day + 16.hours,
    whatsapp_number: contacts[0].cell_phone_number,
    status: :pending,
    payment_status: :pending
  }
]

# Criar agendamentos confirmados
confirmed_appointments.each do |apt_data|
  service = apt_data[:service]
  start_time = apt_data[:start_time]
  end_time = start_time + (service.metadata&.dig('duration_minutes') || 60).minutes

  appointment = Appointment.find_or_create_by!(
    account: account,
    account_user: apt_data[:professional],
    service: service,
    contact: apt_data[:contact],
    start_time: start_time
  ) do |apt|
    apt.end_time = end_time
    apt.whatsapp_number = apt_data[:whatsapp_number]
    apt.price_cents = service.selling_price_cents
    apt.price_currency = 'BRL'
    apt.status = apt_data[:status]
    apt.payment_status = apt_data[:payment_status]
  end

  # Criar comissão se estiver confirmado
  if appointment.confirmed? && appointment.appointment_commissions.empty?
    commission_percentage = 50.0
    commission_amount_cents = (appointment.price_cents * commission_percentage / 100).round
    
    AppointmentCommission.create!(
      appointment: appointment,
      account_user: appointment.account_user,
      commission_type: 0, # percentage
      commission_value: commission_percentage,
      commission_amount_cents: commission_amount_cents
    )
  end

  puts "  ✓ Agendamento confirmado: #{appointment.service.name} - #{appointment.contact.first_name} - #{appointment.start_time.strftime('%d/%m/%Y %H:%M')}"
end

# Criar agendamentos pendentes
pending_appointments.each do |apt_data|
  service = apt_data[:service]
  start_time = apt_data[:start_time]
  end_time = start_time + (service.metadata&.dig('duration_minutes') || 60).minutes

  appointment = Appointment.find_or_create_by!(
    account: account,
    account_user: apt_data[:professional],
    service: service,
    contact: apt_data[:contact],
    start_time: start_time
  ) do |apt|
    apt.end_time = end_time
    apt.whatsapp_number = apt_data[:whatsapp_number]
    apt.price_cents = service.selling_price_cents
    apt.price_currency = 'BRL'
    apt.status = apt_data[:status]
    apt.payment_status = apt_data[:payment_status]
  end

  puts "  ✓ Agendamento pendente: #{appointment.service.name} - #{appointment.contact.first_name} - #{appointment.start_time.strftime('%d/%m/%Y %H:%M')}"
end

puts "\n✅ Dados de agendamentos criados com sucesso!"
puts "   - #{professionals.count} profissionais"
puts "   - #{services.count} serviços"
puts "   - #{contacts.count} contatos"
puts "   - #{Appointment.where(account: account).count} agendamentos"

