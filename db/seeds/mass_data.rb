# frozen_string_literal: true

# Script para criar massa de dados de teste
# Execute com: rails runner db/seeds/mass_data.rb

puts "\n" + "="*80
puts "🌱 CRIANDO MASSA DE DADOS PARA TESTE"
puts "="*80

# Nomes de barbearias/salões
BARBERSHOPS = [
  { name: 'Barbearia do João', email: 'joao@barbearia.com', owner: 'João Silva' },
  { name: 'Salão da Maria', email: 'maria@salao.com', owner: 'Maria Santos' },
  { name: 'Corte & Estilo', email: 'pedro@corteestilo.com', owner: 'Pedro Oliveira' },
  { name: 'Barbearia Premium', email: 'ana@premium.com', owner: 'Ana Costa' },
  { name: 'Estilo Masculino', email: 'carlos@estilo.com', owner: 'Carlos Pereira' },
  { name: 'Salão Elegance', email: 'fernanda@elegance.com', owner: 'Fernanda Lima' },
  { name: 'Corte Rápido', email: 'roberto@corterapido.com', owner: 'Roberto Alves' },
  { name: 'Barbearia Clássica', email: 'juliana@classica.com', owner: 'Juliana Ferreira' }
].freeze

# Serviços padrão
DEFAULT_SERVICES = [
  { name: 'Corte Masculino', price: 30.00, duration: 30 },
  { name: 'Corte + Barba', price: 50.00, duration: 45 },
  { name: 'Barba', price: 20.00, duration: 20 },
  { name: 'Corte Feminino', price: 40.00, duration: 40 },
  { name: 'Corte + Sobrancelha', price: 35.00, duration: 35 },
  { name: 'Pigmentação', price: 150.00, duration: 60 },
  { name: 'Relaxamento', price: 80.00, duration: 90 }
].freeze

# Nomes de profissionais
PROFESSIONAL_NAMES = [
  ['João', 'Silva'], ['Maria', 'Santos'], ['Pedro', 'Oliveira'], ['Ana', 'Costa'],
  ['Carlos', 'Pereira'], ['Fernanda', 'Lima'], ['Roberto', 'Alves'], ['Juliana', 'Ferreira'],
  ['Lucas', 'Martins'], ['Patricia', 'Rocha'], ['Ricardo', 'Souza'], ['Camila', 'Almeida']
].freeze

# Nomes de clientes
CLIENT_NAMES = [
  ['Carlos', 'Pereira'], ['Fernanda', 'Lima'], ['Roberto', 'Alves'], ['Juliana', 'Ferreira'],
  ['Lucas', 'Martins'], ['Patricia', 'Rocha'], ['Ricardo', 'Souza'], ['Camila', 'Almeida'],
  ['Bruno', 'Cavalcanti'], ['Amanda', 'Rodrigues'], ['Felipe', 'Araújo'], ['Larissa', 'Mendes']
].freeze

def create_account_with_data(barbershop_data, index)
  puts "\n" + "-"*80
  puts "📦 Criando conta: #{barbershop_data[:name]}"
  puts "-"*80

  # Criar empresa
  company = Company.find_or_initialize_by(email: barbershop_data[:email])
  if company.new_record?
    company.assign_attributes(
      person_type_cd: 1, # Legal
      contact_type_cd: 0,
      first_name: barbershop_data[:name],
      document_1: "00#{index.to_s.rjust(12, '0')}0001",
      document_3: "#{index.to_s.rjust(8, '0')}",
      email: barbershop_data[:email]
    )
    company.save!
  end

  # Criar usuário dono
  owner_email = barbershop_data[:email]
  owner = User.find_or_initialize_by(email: owner_email)
  if owner.new_record?
    owner.assign_attributes(
      password: 'password123',
      password_confirmation: 'password123',
      first_name: barbershop_data[:owner].split(' ').first,
      last_name: barbershop_data[:owner].split(' ').last,
      confirmed_at: Time.current,
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current
    )
    owner.skip_confirmation!
    owner.save!
  end

  # Criar conta
  account = Account.find_or_initialize_by(company: company)
  if account.new_record?
    account.assign_attributes(
      owner: owner,
      account_type_cd: Account::ACCOUNT_TYPES[:business],
      default_currency: 'BRL',
      admin: false,
      free: true
    )
    account.save!
  end

  # Associar owner à conta
  AccountUser.find_or_create_by!(account: account, user: owner) do |au|
    au.role_cd = AccountUser::ROLES[:admin]
  end

  # Criar profissionais (2-4 por conta)
  num_professionals = rand(2..4)
  professionals = []
  num_professionals.times do |i|
    prof_name = PROFESSIONAL_NAMES[(index * 4 + i) % PROFESSIONAL_NAMES.size]
    prof_email = "prof#{index}_#{i}@barbershop.com"
    
    prof_user = User.find_or_initialize_by(email: prof_email)
    if prof_user.new_record?
      prof_user.assign_attributes(
        password: 'password123',
        password_confirmation: 'password123',
        first_name: prof_name[0],
        last_name: prof_name[1],
        confirmed_at: Time.current,
        accepted_terms_at: Time.current,
        accepted_privacy_at: Time.current,
        account: account
      )
      prof_user.skip_confirmation!
      prof_user.save!
    end

    prof_account_user = AccountUser.find_or_create_by!(account: account, user: prof_user) do |au|
      au.role_cd = AccountUser::ROLES[:member]
    end
    
    professionals << prof_account_user
    puts "  ✓ Profissional: #{prof_user.name}"
  end

  # Criar serviços
  services = []
  DEFAULT_SERVICES.each do |service_data|
    service = Service.find_or_create_by!(account: account, name: service_data[:name]) do |s|
      s.description = "Serviço: #{service_data[:name]}"
      s.selling_price_cents = (service_data[:price] * 100).to_i
      s.cost_price_cents = ((service_data[:price] * 0.5) * 100).to_i
      s.currency = 'BRL'
      s.offer_type_cd = Service::SERVICE_TYPES[:provided]
      s.enabled = 't'
      s.metadata = { duration_minutes: service_data[:duration] }
    end
    services << service
  end
  puts "  ✓ #{services.count} serviços criados"

  # Criar contatos/clientes (5-10 por conta)
  num_clients = rand(5..10)
  contacts = []
  num_clients.times do |i|
    client_name = CLIENT_NAMES[(index * 10 + i) % CLIENT_NAMES.size]
    phone = "119#{rand(10000000..99999999)}"
    client_email = "cliente#{index}_#{i}@email.com"
    
    contact = Contact.find_or_create_by!(account: account, cell_phone_number: phone) do |c|
      c.first_name = client_name[0]
      c.last_name = client_name[1]
      c.email = client_email
      c.contact_type_cd = Contact::CONTACT_TYPES[:customer]
    end
    contacts << contact
  end
  puts "  ✓ #{contacts.count} clientes criados"

  # Criar categorias básicas
  categories = []
  ['Receitas', 'Despesas Fixas', 'Despesas Variáveis', 'Salários', 'Material'].each do |cat_name|
    category = Category.find_or_create_by!(account: account, name: cat_name) do |c|
      c.transaction_type_cd = cat_name == 'Receitas' ? 0 : 1
    end
    categories << category
  end

  # Criar conta bancária (garantir que seja a padrão)
  # Primeiro, remover default de outras contas se existirem
  BankAccount.where(account: account, default: true).update_all(default: false)
  
  bank_account = BankAccount.find_or_create_by!(account: account, name: 'Conta Principal') do |ba|
    ba.account_type_cd = 0 # current_account
    ba.default = true
    ba.initial_balance_cents = 0
  end
  
  # Garantir que seja a padrão
  bank_account.update!(default: true) unless bank_account.default?

  # Criar transações (20-50 por conta)
  num_transactions = rand(20..50)
  transactions_created = 0
  num_transactions.times do |i|
    is_revenue = rand < 0.4 # 40% receitas, 60% despesas
    amount = is_revenue ? rand(50.0..500.0) : rand(20.0..300.0)
    due_date = rand(90.days.ago..30.days.from_now)
    paid = rand < 0.7 # 70% pagas
    
    transaction = Transaction.find_or_initialize_by(
      account: account,
      description: is_revenue ? "Receita #{i+1}" : "Despesa #{i+1}",
      due_date: due_date
    )
    
    if transaction.new_record?
      transaction.assign_attributes(
        amount_cents: (amount * 100).to_i,
        amount_currency: 'BRL',
        transaction_type_cd: is_revenue ? 0 : rand(1..4),
        due_date: due_date,
        paid: paid,
        paid_at: paid ? due_date : nil,
        category_id: categories.sample.id,
        bank_account_id: bank_account.id,
        payment_method_cd: rand(0..3),
        payment_type_cd: 0,
        kind_cd: 0
      )
      transaction.save!
      transactions_created += 1
    end
  end
  puts "  ✓ #{transactions_created} transações criadas"

  # Criar agendamentos (10-30 por conta)
  num_appointments = rand(10..30)
  appointments_created = 0
  num_appointments.times do |i|
    professional = professionals.sample
    service = services.sample
    contact = contacts.sample
    start_time = rand(30.days.ago..30.days.from_now).beginning_of_day + rand(8..18).hours
    end_time = start_time + (service.metadata&.dig('duration_minutes') || 60).minutes
    
    # Evitar conflitos de horário
    next if Appointment.where(account_user: professional, account: account)
                      .where('start_time < ? AND end_time > ?', end_time, start_time)
                      .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])
                      .exists?
    
    status_rand = rand
    if status_rand < 0.4
      status = :confirmed
      payment_status = :paid
    elsif status_rand < 0.7
      status = :pending
      payment_status = :pending
    elsif status_rand < 0.9
      status = :completed
      payment_status = :paid
    else
      status = :canceled
      payment_status = :pending
    end

    appointment = Appointment.find_or_initialize_by(
      account: account,
      account_user: professional,
      service: service,
      start_time: start_time
    )
    
    if appointment.new_record?
      appointment.assign_attributes(
        end_time: end_time,
        whatsapp_number: contact.cell_phone_number,
        price_cents: service.selling_price_cents,
        price_currency: 'BRL',
        status: status,
        payment_status: payment_status,
        contact_id: contact.id
      )
      appointment.save!
      appointments_created += 1

      # Criar comissão se confirmado/completado e pago
      # Pular criação de comissão por enquanto para evitar erros
      # As comissões serão criadas automaticamente quando o agendamento for confirmado

      # Transação será criada automaticamente pelo callback do appointment quando payment_status mudar para paid
    end
  end
  puts "  ✓ #{appointments_created} agendamentos criados"

  {
    account: account,
    professionals: professionals.count,
    services: services.count,
    contacts: contacts.count,
    transactions: transactions_created,
    appointments: appointments_created
  }
end

# Criar todas as contas
results = []
BARBERSHOPS.each_with_index do |barbershop, index|
  result = create_account_with_data(barbershop, index)
  results << result
end

# Resumo final
puts "\n" + "="*80
puts "✅ MASSA DE DADOS CRIADA COM SUCESSO!"
puts "="*80
puts "\n📊 RESUMO:"
puts "   Total de contas: #{results.count}"
puts "   Total de profissionais: #{results.sum { |r| r[:professionals] }}"
puts "   Total de serviços: #{results.sum { |r| r[:services] }}"
puts "   Total de clientes: #{results.sum { |r| r[:contacts] }}"
puts "   Total de transações: #{results.sum { |r| r[:transactions] }}"
puts "   Total de agendamentos: #{results.sum { |r| r[:appointments] }}"
puts "\n"

