# frozen_string_literal: true
#
# Perfis de demonstração para a vitrine pública "Descobrir"
# Execute com: bundle exec rails runner db/seeds/discover_profiles.rb

puts "\n#{'='*70}"
puts "🌱 CRIANDO PERFIS PARA A VITRINE PÚBLICA — DESCOBRIR"
puts "#{'='*70}\n"

PROFILES = [
  {
    first_name: 'Ana',
    last_name: 'Lima',
    email: 'ana.lima.psi@discover-demo.orbi',
    phone: '(11) 97001-0001',
    profession_category: 'Psicólogo',
    business_name: 'Dra. Ana Lima',
    description: 'Psicóloga clínica especializada em ansiedade, depressão e relacionamentos. Atendimento humanizado com mais de 8 anos de experiência.',
    city: 'São Paulo', district: 'Mooca', state: 'SP', postcode: '03104-000',
    services: [
      { name: 'Consulta Individual',       price: 200_00, duration: 50, modality: 'presencial' },
      { name: 'Consulta Online',           price: 170_00, duration: 50, modality: 'online' },
      { name: 'Avaliação Psicológica',     price: 350_00, duration: 90, modality: 'presencial' },
    ]
  },
  {
    first_name: 'Carlos',
    last_name: 'Ferreira',
    email: 'carlos.ferreira.adv@discover-demo.orbi',
    phone: '(11) 97001-0002',
    profession_category: 'Advogado',
    business_name: 'Dr. Carlos Ferreira',
    description: 'Advogado especialista em direito trabalhista e previdenciário. Defendo os seus direitos com dedicação e transparência desde 2010.',
    city: 'São Paulo', district: 'Itaquera', state: 'SP', postcode: '08210-000',
    services: [
      { name: 'Consulta Inicial',          price: 150_00, duration: 60,  modality: 'presencial' },
      { name: 'Análise de Contrato',       price: 300_00, duration: 90,  modality: 'presencial' },
      { name: 'Consultoria Trabalhista',   price: 250_00, duration: 60,  modality: 'online' },
    ]
  },
  {
    first_name: 'Gabriela',
    last_name: 'Mendes',
    email: 'gabi.mendes.nutri@discover-demo.orbi',
    phone: '(11) 97001-0003',
    profession_category: 'Nutricionista',
    business_name: 'Gabriela Mendes Nutrição',
    description: 'Nutricionista funcional com foco em emagrecimento saudável, hipertrofia e reeducação alimentar. Planos personalizados para sua rotina.',
    city: 'São Paulo', district: 'Pinheiros', state: 'SP', postcode: '05422-000',
    services: [
      { name: 'Consulta Nutricional',      price: 180_00, duration: 60, modality: 'presencial' },
      { name: 'Plano Alimentar Completo',  price: 450_00, duration: 90, modality: 'presencial' },
      { name: 'Retorno Mensal',            price: 120_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Bruno',
    last_name: 'Santos',
    email: 'bruno.santos.pt@discover-demo.orbi',
    phone: '(11) 97001-0004',
    profession_category: 'Personal Trainer',
    business_name: 'Bruno Santos Personal',
    description: 'Personal trainer certificado com especialização em treino funcional, crossfit e reabilitação esportiva. Treinos presenciais e online.',
    city: 'São Paulo', district: 'Vila Mariana', state: 'SP', postcode: '04105-000',
    services: [
      { name: 'Avaliação Física',          price: 100_00, duration: 60, modality: 'presencial' },
      { name: 'Treino Presencial',         price: 120_00, duration: 60, modality: 'presencial' },
      { name: 'Plano Online Mensal',       price: 350_00, duration: 30, modality: 'online' },
    ]
  },
  {
    first_name: 'Thiago',
    last_name: 'Barbosa',
    email: 'thiago.barbosa.barber@discover-demo.orbi',
    phone: '(11) 97001-0005',
    profession_category: 'Barbeiro',
    business_name: 'Thiago Barbosa Barbearia',
    description: 'Barbearia premium no coração do Tatuapé. Cortes clássicos, degradê, barba e tratamentos capilares. Ambiente exclusivo para o homem moderno.',
    city: 'São Paulo', district: 'Tatuapé', state: 'SP', postcode: '03310-000',
    services: [
      { name: 'Corte Masculino',           price: 60_00,  duration: 30, modality: 'presencial' },
      { name: 'Barba Completa',            price: 45_00,  duration: 30, modality: 'presencial' },
      { name: 'Combo Corte + Barba',       price: 95_00,  duration: 60, modality: 'presencial' },
    ]
  },
  {
    first_name: 'Paulo',
    last_name: 'Corrêa',
    email: 'paulo.correa.odonto@discover-demo.orbi',
    phone: '(11) 97001-0006',
    profession_category: 'Dentista',
    business_name: 'Dr. Paulo Corrêa Odontologia',
    description: 'Odontologia estética e preventiva. Clareamento dental, restaurações, implantes e ortodontia. Cuido do seu sorriso com tecnologia de ponta.',
    city: 'São Paulo', district: 'Lapa', state: 'SP', postcode: '05072-000',
    services: [
      { name: 'Consulta e Avaliação',      price: 80_00,  duration: 30, modality: 'presencial' },
      { name: 'Limpeza e Profilaxia',      price: 150_00, duration: 60, modality: 'presencial' },
      { name: 'Clareamento Dental',        price: 800_00, duration: 90, modality: 'presencial' },
    ]
  },
  {
    first_name: 'Marina',
    last_name: 'Alves',
    email: 'marina.alves.coach@discover-demo.orbi',
    phone: '(11) 97001-0007',
    profession_category: 'Coach',
    business_name: 'Marina Alves Coaching',
    description: 'Coach executiva e de vida certificada pelo ICF. Especialista em transição de carreira, liderança e desenvolvimento pessoal. Online e presencial.',
    city: 'São Paulo', district: 'Jardins', state: 'SP', postcode: '01402-000',
    services: [
      { name: 'Sessão de Coaching',        price: 250_00, duration: 60, modality: 'presencial' },
      { name: 'Pacote 4 Sessões',          price: 900_00, duration: 60, modality: 'online' },
      { name: 'Workshop em Grupo',         price: 150_00, duration: 120, modality: 'online' },
    ]
  },
  {
    first_name: 'Felipe',
    last_name: 'Ramos',
    email: 'felipe.ramos.fisio@discover-demo.orbi',
    phone: '(11) 97001-0008',
    profession_category: 'Fisioterapeuta',
    business_name: 'Felipe Ramos Fisioterapia',
    description: 'Fisioterapeuta especialista em ortopedia e reabilitação esportiva. Pilates clínico, RPG e terapia manual. Recuperação rápida e segura.',
    city: 'São Paulo', district: 'Moema', state: 'SP', postcode: '04083-000',
    services: [
      { name: 'Avaliação Fisioterapêutica', price: 120_00, duration: 60, modality: 'presencial' },
      { name: 'Sessão Individual',          price: 150_00, duration: 50, modality: 'presencial' },
      { name: 'Pilates Clínico',            price: 130_00, duration: 50, modality: 'presencial' },
    ]
  },
].freeze

created = 0
skipped = 0

PROFILES.each do |profile|
  print "\n👤 #{profile[:business_name]}..."

  if User.exists?(email: profile[:email])
    puts " já existe, pulando."
    skipped += 1
    next
  end

  ActiveRecord::Base.transaction do
    # 1. Criar usuário — callback cria a account automaticamente
    user = User.new(
      email: profile[:email],
      first_name: profile[:first_name],
      last_name: profile[:last_name],
      phone_number: profile[:phone],
      password: 'discover123',
      password_confirmation: 'discover123',
      confirmed_at: Time.current,
      accepted_terms_at: Time.current,
      accepted_privacy_at: Time.current,
      terms_of_service: '1',
      preferred_language: 'pt-BR'
    )
    user.skip_confirmation!
    user.save!

    account = user.reload.account
    raise "Account não criada para #{profile[:email]}" unless account

    company = account.company

    # 2. Atualizar empresa com dados do profissional
    company.update!(
      screen_name: profile[:business_name],
      phone_number: profile[:phone]
    )

    # 3. Adicionar endereço
    company.addresses.create!(
      city: profile[:city],
      district: profile[:district],
      state: profile[:state],
      postcode: profile[:postcode],
      country: 'BR'
    )

    # 4. Marcar conta como visível na vitrine
    account.update!(
      directory_visible:     true,
      profession_category:   profile[:profession_category],
      directory_description: profile[:description],
      subscription_status:   'active'
    )

    # 5. Criar serviços
    profile[:services].each do |svc|
      account.services.create!(
        name: svc[:name],
        selling_price_cents: svc[:price],
        currency: 'BRL',
        enabled: true,
        description: nil,
        metadata: {
          duration_minutes: svc[:duration],
          modality: svc[:modality]
        }
      )
    end

    # 6. Criar link de agendamento ativo
    account.appointment_links.create!(
      name: "Agendar com #{profile[:business_name]}",
      token: SecureRandom.hex(16),
      active: true,
      settings: {}
    )

    puts " ✅ criado com #{profile[:services].count} serviços"
    created += 1
  end

rescue => e
  puts " ❌ ERRO: #{e.message}"
  puts e.backtrace.first(3).map { |l| "   #{l}" }.join("\n")
end

puts "\n#{'='*70}"
puts "✅ Criados: #{created}  |  ⏭  Pulados: #{skipped}"
puts "🔗 Acesse /descobrir para ver a vitrine pública"
puts "#{'='*70}\n"
