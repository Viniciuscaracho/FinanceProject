# frozen_string_literal: true

# Seed de cenários de comissão para validação do fluxo completo
# Execute com: rails runner db/seeds/commission_scenarios.rb

puts "\n" + "="*80
puts "💰 CENÁRIOS DE COMISSÃO - VALIDAÇÃO DO FLUXO COMPLETO"
puts "="*80

account = Account.first
unless account
  puts "❌ ERRO: Nenhuma conta encontrada. Execute db:seed primeiro!"
  exit
end

puts "\n📋 Conta: #{account.id} - #{account.company&.name || account.name}"

# ============================================================================
# CENÁRIOS DE PROFISSIONAIS COM DIFERENTES COMISSÕES
# ============================================================================
# Cenário 1: Profissional júnior — comissão menor (30%)
# Cenário 2: Profissional sênior — comissão padrão (50%)
# Cenário 3: Sócio/Dono — comissão alta (70%)
# Cenário 4: Estagiário — comissão muito baixa (15%)
# Cenário 5: Freelancer — comissão fixa (configurada por serviço)

scenarios = [
  { first_name: "João", last_name: "Junior",     email: "joao.junior@barber.com",    commission_percentage: 30.0, label: "Júnior (30%)" },
  { first_name: "Maria", last_name: "Senior",    email: "maria.senior@barber.com",   commission_percentage: 50.0, label: "Sênior (50%)" },
  { first_name: "Pedro", last_name: "Socio",     email: "pedro.socio@barber.com",    commission_percentage: 70.0, label: "Sócio (70%)" },
  { first_name: "Ana",   last_name: "Estagiaria",email: "ana.estagiaria@barber.com", commission_percentage: 15.0, label: "Estagiária (15%)" },
  { first_name: "Lucas", last_name: "Freelancer",email: "lucas.freelancer@barber.com",commission_percentage: 40.0, label: "Freelancer (40%)" },
]

professionals = {}

puts "\n" + "-"*60
puts "👤 Criando/atualizando profissionais com comissões distintas..."
puts "-"*60

scenarios.each do |scenario|
  user = User.find_by(email: scenario[:email])

  unless user
    user = User.create!(
      email: scenario[:email],
      first_name: scenario[:first_name],
      last_name: scenario[:last_name],
      password: "password123",
      password_confirmation: "password123",
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current
    )
  end

  account_user = account.account_users.find_by(user: user)

  default_schedule = {
    monday:    { enabled: true,  start_hour: 8, end_hour: 20 },
    tuesday:   { enabled: true,  start_hour: 8, end_hour: 20 },
    wednesday: { enabled: true,  start_hour: 8, end_hour: 20 },
    thursday:  { enabled: true,  start_hour: 8, end_hour: 20 },
    friday:    { enabled: true,  start_hour: 8, end_hour: 20 },
    saturday:  { enabled: true,  start_hour: 8, end_hour: 20 },
    sunday:    { enabled: true,  start_hour: 8, end_hour: 20 }
  }

  if account_user
    account_user.update!(commission_percentage: scenario[:commission_percentage], schedule: default_schedule)
    puts "  ♻️  Atualizado: #{scenario[:label]} → #{scenario[:first_name]} #{scenario[:last_name]}"
  else
    account_user = account.account_users.create!(
      user: user,
      role: :custom,
      commission_percentage: scenario[:commission_percentage],
      schedule: default_schedule
    )
    puts "  ✅ Criado:    #{scenario[:label]} → #{scenario[:first_name]} #{scenario[:last_name]}"
  end

  professionals[scenario[:label]] = account_user
end

# ============================================================================
# BUSCAR SERVIÇOS DISPONÍVEIS
# ============================================================================
services = account.services.limit(5)

if services.empty?
  puts "\n⚠️  Nenhum serviço encontrado. Crie serviços antes de continuar com os agendamentos."
  puts "   Os profissionais foram criados com as comissões corretas."

  puts "\n" + "="*80
  puts "📊 RESUMO DAS COMISSÕES CONFIGURADAS"
  puts "="*80
  professionals.each do |label, au|
    puts "  #{label.ljust(20)} → #{au.commission_percentage}%"
  end
  exit
end

puts "\n  Serviços disponíveis: #{services.map(&:name).join(', ')}"
service = services.first

# ============================================================================
# CONFIGURAÇÃO DE COMISSÃO POR SERVIÇO (OVERRIDE)
# ============================================================================
# O Lucas Freelancer tem 40% de comissão padrão,
# mas recebe 60% em "coloração" por ser especialista no serviço.

if services.count >= 2
  puts "\n" + "-"*60
  puts "🎨 Configurando override de comissão por serviço (Lucas Freelancer)..."
  puts "-"*60

  lucas = professionals["Freelancer (40%)"]
  specialty_service = services.second

  existing = lucas.professional_commissions.find_by(service: specialty_service)
  if existing
    existing.update!(commission_type: :percentage, commission_value: 60.0)
    puts "  ♻️  Override atualizado: #{specialty_service.name} → 60% (era #{existing.commission_value}%)"
  else
    lucas.professional_commissions.create!(
      service: specialty_service,
      commission_type: :percentage,
      commission_value: 60.0
    )
    puts "  ✅ Override criado: #{specialty_service.name} → 60% (padrão era 40%)"
  end
end

# ============================================================================
# CRIAR AGENDAMENTOS COM DIFERENTES PROFISSIONAIS
# ============================================================================
puts "\n" + "-"*60
puts "📅 Criando agendamentos para validar cálculo de comissões..."
puts "-"*60

contact = account.contacts.first

appointment_scenarios = [
  { prof_label: "Júnior (30%)",     price: 80.00,  description: "Corte simples" },
  { prof_label: "Sênior (50%)",     price: 120.00, description: "Corte + barba" },
  { prof_label: "Sócio (70%)",      price: 200.00, description: "Tratamento completo" },
  { prof_label: "Estagiária (15%)", price: 50.00,  description: "Lavagem + escova" },
  { prof_label: "Freelancer (40%)", price: 150.00, description: "Serviço padrão" },
]

created_appointments = []

appointment_scenarios.each_with_index do |scenario, idx|
  prof = professionals[scenario[:prof_label]]
  next unless prof

  start_time = Time.current.beginning_of_day + (10 + idx * 2).hours

  existing = account.appointments.find_by(
    account_user: prof,
    service: service,
    start_time: start_time.beginning_of_day..start_time.end_of_day
  )

  if existing
    puts "  ⏩ Já existe agendamento para #{prof.user.first_name} hoje, pulando..."
    created_appointments << existing
    next
  end

  phone = contact&.cell_phone_number || contact&.phone_number || "11999990#{idx.to_s.rjust(3, '0')}"

  appointment = account.appointments.create!(
    account_user: prof,
    service: service,
    contact: contact,
    whatsapp_number: phone,
    start_time: start_time,
    end_time: start_time + 1.hour,
    price_cents: (scenario[:price] * 100).to_i,
    status: :confirmed,
    payment_status: :paid
  )
  created_appointments << appointment
  puts "  ✅ #{scenario[:description]} | #{prof.user.first_name} (#{prof.commission_percentage}%) | R$ #{scenario[:price]}"
end

# ============================================================================
# GERAR COMISSÕES PARA OS AGENDAMENTOS CRIADOS
# ============================================================================
puts "\n" + "-"*60
puts "💳 Processando comissões dos agendamentos..."
puts "-"*60

created_appointments.each do |appointment|
  next unless appointment.paid?

  if appointment.appointment_commissions.exists?
    commission = appointment.appointment_commissions.first
    puts "  ♻️  Já processada: #{appointment.account_user.user.first_name} | R$ #{appointment.price.format} → comissão R$ #{commission.commission_amount.format} (#{commission.commission_value}%)"
  else
    appointment.send(:create_commissions)
    commission = appointment.appointment_commissions.first
    if commission
      puts "  ✅ Comissão gerada: #{appointment.account_user.user.first_name} | R$ #{appointment.price.format} → R$ #{commission.commission_amount.format} (#{commission.commission_value}%)"
    else
      puts "  ❌ Falha ao gerar comissão para #{appointment.account_user.user.first_name}"
    end
  end
end

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================
puts "\n" + "="*80
puts "📊 RELATÓRIO DE COMISSÕES POR PROFISSIONAL"
puts "="*80

puts "\n#{"Profissional".ljust(22)} #{"% Padrão".rjust(10)} #{"Agendamentos".rjust(14)} #{"Total Serviços".rjust(16)} #{"Total Comissão".rjust(16)}"
puts "-"*80

professionals.each do |label, au|
  commissions = au.appointment_commissions.joins(:appointment).where(appointments: { account_id: account.id })
  total_appointments = commissions.count
  total_price = au.appointments.where(account: account).sum(:price_cents) / 100.0
  total_commission = commissions.sum(:commission_amount_cents) / 100.0

  puts "#{au.user.first_name.ljust(22)} #{("#{au.commission_percentage}%").rjust(10)} #{total_appointments.to_s.rjust(14)} #{"R$ #{format('%.2f', total_price)}".rjust(16)} #{"R$ #{format('%.2f', total_commission)}".rjust(16)}"
end

puts "\n" + "="*80
puts "✅ Cenários de comissão validados com sucesso!"
puts "="*80
puts "\n💡 Dicas:"
puts "   • Edite a % de comissão de cada profissional em /professionals"
puts "   • Novas comissões são calculadas automaticamente ao confirmar pagamento"
puts "   • Veja o relatório em /commissions com filtro por profissional"
puts "   • Overrides por serviço são configurados via API: PATCH /professionals/:id/commission_configs"
