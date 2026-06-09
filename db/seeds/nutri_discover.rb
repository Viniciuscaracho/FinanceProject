# frozen_string_literal: true
#
# Nutricionistas de demonstração com endereços completos, coordenadas reais de SP e fotos
# Execute: bundle exec rails runner db/seeds/nutri_discover.rb

require 'open-uri'

NUTRIS = [
  {
    first_name: 'Fernanda', last_name: 'Costa',
    email: 'fernanda.costa.nutri@discover-demo.orbi',
    business_name: 'Fernanda Costa Nutrição',
    description: 'Nutricionista funcional com 10 anos de experiência. Especialista em emagrecimento, modulação intestinal e nutrição esportiva. Atendimento presencial e online.',
    specialties: ['emagrecimento', 'esportiva'],
    instagram_url: 'https://instagram.com/fernandacostanutri',
    photo_gender: 'women', photo_index: 1,
    address: { line1: 'Rua dos Pinheiros, 498', district: 'Pinheiros', city: 'São Paulo', state: 'SP', postcode: '05422-001', lat: -23.5632, lng: -46.6833 },
    services: [
      { name: 'Consulta Nutricional',     price: 220_00, duration: 60, modality: 'presencial' },
      { name: 'Plano Alimentar Completo', price: 480_00, duration: 90, modality: 'presencial' },
      { name: 'Retorno / Acompanhamento', price: 130_00, duration: 45, modality: 'online' },
      { name: 'Consulta Online',          price: 190_00, duration: 60, modality: 'online' },
    ]
  },
  {
    first_name: 'Juliana', last_name: 'Rocha',
    email: 'juliana.rocha.nutri@discover-demo.orbi',
    business_name: 'Dra. Juliana Rocha',
    description: 'Especialista em nutrição materno-infantil, gestação e aleitamento. Também atua com saúde feminina e síndrome do ovário policístico. CRN 12345.',
    specialties: ['gestação', 'saúde feminina', 'infantil'],
    instagram_url: 'https://instagram.com/drjulianarocha',
    photo_gender: 'women', photo_index: 2,
    address: { line1: 'Alameda Santos, 715', district: 'Jardim Paulista', city: 'São Paulo', state: 'SP', postcode: '01419-001', lat: -23.5630, lng: -46.6542 },
    services: [
      { name: 'Consulta Nutricional Feminina', price: 250_00, duration: 60, modality: 'presencial' },
      { name: 'Nutrição na Gestação',          price: 280_00, duration: 60, modality: 'presencial' },
      { name: 'Retorno Mensal',                price: 150_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Rodrigo', last_name: 'Andrade',
    email: 'rodrigo.andrade.nutri@discover-demo.orbi',
    business_name: 'Rodrigo Andrade Performance',
    description: 'Nutricionista esportivo para atletas e praticantes de atividade física. Foco em ganho de massa, performance e suplementação inteligente.',
    specialties: ['esportiva', 'emagrecimento'],
    instagram_url: 'https://instagram.com/rodrigoandradenutrição',
    photo_gender: 'men', photo_index: 1,
    address: { line1: 'Av. Ibirapuera, 2033', district: 'Moema', city: 'São Paulo', state: 'SP', postcode: '04029-901', lat: -23.6004, lng: -46.6634 },
    services: [
      { name: 'Avaliação Nutricional Esportiva', price: 300_00, duration: 75, modality: 'presencial' },
      { name: 'Plano de Performance',            price: 550_00, duration: 90, modality: 'presencial' },
      { name: 'Consultoria de Suplementação',    price: 180_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Camila', last_name: 'Ferreira',
    email: 'camila.ferreira.nutri@discover-demo.orbi',
    business_name: 'Camila Ferreira Nutrição Clínica',
    description: 'Nutrição clínica com abordagem integrativa. Especialista em doenças crônicas, diabetes, hipertensão e saúde digestiva. Atendimento acolhedor e individualizado.',
    specialties: ['emagrecimento', 'vegetariana'],
    instagram_url: nil,
    photo_gender: 'women', photo_index: 3,
    address: { line1: 'Rua Abílio Soares, 532', district: 'Paraíso', city: 'São Paulo', state: 'SP', postcode: '04005-002', lat: -23.5783, lng: -46.6417 },
    services: [
      { name: 'Consulta Clínica',            price: 200_00, duration: 60, modality: 'presencial' },
      { name: 'Plano para Doenças Crônicas', price: 420_00, duration: 90, modality: 'presencial' },
      { name: 'Orientação Nutricional',      price: 160_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Beatriz', last_name: 'Martins',
    email: 'beatriz.martins.nutri@discover-demo.orbi',
    business_name: 'Bea Martins Nutrição',
    description: 'Nutricionista vegana e vegetariana. Ajudo pessoas a fazerem a transição alimentar de forma segura, sem carências nutricionais e com muito sabor.',
    specialties: ['vegetariana', 'emagrecimento'],
    instagram_url: 'https://instagram.com/beamartinsnutri',
    photo_gender: 'women', photo_index: 4,
    address: { line1: 'Rua Pamplona, 1218', district: 'Jardim Paulista', city: 'São Paulo', state: 'SP', postcode: '01405-100', lat: -23.5660, lng: -46.6522 },
    services: [
      { name: 'Consulta Vegetariana/Vegana', price: 210_00, duration: 60, modality: 'presencial' },
      { name: 'Cardápio Plant-Based',        price: 390_00, duration: 75, modality: 'online' },
      { name: 'Retorno Quinzenal',           price: 120_00, duration: 30, modality: 'online' },
    ]
  },
  {
    first_name: 'Lucas', last_name: 'Oliveira',
    email: 'lucas.oliveira.nutri@discover-demo.orbi',
    business_name: 'Lucas Oliveira Nutrição & Saúde',
    description: 'Nutricionista com pós-graduação em nutrição oncológica e imunologia. Atendo pacientes em tratamento de câncer, pós-operatório e imunocomprometidos.',
    specialties: ['emagrecimento'],
    instagram_url: nil,
    photo_gender: 'men', photo_index: 2,
    address: { line1: 'Av. Angélica, 1517', district: 'Higienópolis', city: 'São Paulo', state: 'SP', postcode: '01227-200', lat: -23.5457, lng: -46.6612 },
    services: [
      { name: 'Consulta Nutricional',      price: 240_00, duration: 60, modality: 'presencial' },
      { name: 'Acompanhamento Oncológico', price: 300_00, duration: 60, modality: 'presencial' },
      { name: 'Teleconsulta',              price: 200_00, duration: 50, modality: 'online' },
    ]
  },
  {
    first_name: 'Patricia', last_name: 'Lima',
    email: 'patricia.lima.nutri@discover-demo.orbi',
    business_name: 'Patricia Lima Emagrecimento',
    description: 'Nutricionista comportamental e coach de emagrecimento. Trabalho com a relação emocional com a comida para resultados duradouros. Método exclusivo RealFood.',
    specialties: ['emagrecimento', 'saúde feminina'],
    instagram_url: 'https://instagram.com/patricialimanutrição',
    photo_gender: 'women', photo_index: 5,
    address: { line1: 'Rua Oscar Freire, 129', district: 'Cerqueira César', city: 'São Paulo', state: 'SP', postcode: '01426-001', lat: -23.5636, lng: -46.6713 },
    services: [
      { name: 'Consulta Comportamental', price: 260_00, duration: 75, modality: 'presencial' },
      { name: 'Programa 3 Meses',        price: 980_00, duration: 60, modality: 'online' },
      { name: 'Sessão Online',           price: 200_00, duration: 60, modality: 'online' },
    ]
  },
  {
    first_name: 'Thais', last_name: 'Barbosa',
    email: 'thais.barbosa.nutri@discover-demo.orbi',
    business_name: 'Dra. Thais Barbosa',
    description: 'Nutricionista pediatra especializada em alimentação infantil, introdução alimentar (BLW e BLWM) e nutrição na adolescência.',
    specialties: ['infantil'],
    instagram_url: 'https://instagram.com/draThaisBarbosa',
    photo_gender: 'women', photo_index: 6,
    address: { line1: 'Rua Dr. Tomás Carvalhal, 305', district: 'Paraíso', city: 'São Paulo', state: 'SP', postcode: '04006-001', lat: -23.5742, lng: -46.6408 },
    services: [
      { name: 'Consulta Nutrição Infantil',  price: 230_00, duration: 60, modality: 'presencial' },
      { name: 'Orientação Introdução Alim.', price: 280_00, duration: 75, modality: 'presencial' },
      { name: 'Retorno Online',              price: 140_00, duration: 40, modality: 'online' },
    ]
  },
  {
    first_name: 'Ana Clara', last_name: 'Pereira',
    email: 'anaclara.pereira.nutri@discover-demo.orbi',
    business_name: 'Ana Clara Pereira Nutrição',
    description: 'Nutricionista clínica e funcional com foco em saúde hormonal, tireóide e síndrome dos ovários policísticos. Atendimento personalizado e baseado em evidências.',
    specialties: ['hormonal', 'saúde feminina'],
    instagram_url: 'https://instagram.com/anaclaranutri',
    photo_gender: 'women', photo_index: 7,
    address: { line1: 'Av. João Dias, 1083', district: 'Brooklin', city: 'São Paulo', state: 'SP', postcode: '04723-001', lat: -23.6180, lng: -46.6948 },
    services: [
      { name: 'Consulta Clínica Funcional',  price: 240_00, duration: 60, modality: 'presencial' },
      { name: 'Programa Saúde Hormonal',     price: 720_00, duration: 90, modality: 'presencial' },
      { name: 'Retorno Online',              price: 150_00, duration: 45, modality: 'online' },
    ]
  },
  {
    first_name: 'Felipe', last_name: 'Souza',
    email: 'felipe.souza.nutri@discover-demo.orbi',
    business_name: 'Felipe Souza Performance',
    description: 'Nutricionista esportivo especializado em musculação, crossfit e corrida de rua. Protocolos individualizados para maximizar performance e recuperação muscular.',
    specialties: ['esportiva', 'emagrecimento'],
    instagram_url: 'https://instagram.com/felipesouzanutri',
    photo_gender: 'men', photo_index: 3,
    address: { line1: 'Rua Harmonia, 547', district: 'Vila Madalena', city: 'São Paulo', state: 'SP', postcode: '05435-000', lat: -23.5566, lng: -46.6919 },
    services: [
      { name: 'Avaliação Esportiva',         price: 280_00, duration: 75, modality: 'presencial' },
      { name: 'Plano de Hipertrofia',        price: 520_00, duration: 90, modality: 'presencial' },
      { name: 'Acompanhamento Mensal',       price: 350_00, duration: 60, modality: 'online' },
    ]
  },
].freeze

def attach_photo(company, method_name, url, filename)
  io = URI.open(url, 'rb')
  company.public_send(method_name).attach(io: io, filename: filename, content_type: 'image/jpeg')
rescue => e
  puts "    ⚠️  Foto '#{method_name}' falhou (#{e.class}: #{e.message})"
end

puts "\n#{'='*70}"
puts '🥦 CRIANDO NUTRICIONISTAS COM ENDEREÇOS, COORDENADAS E FOTOS'
puts "#{'='*70}\n"

created = 0; skipped = 0; errors = 0

NUTRIS.each_with_index do |p, idx|
  cover_seed = idx + 1
  print "👤 #{p[:business_name]}..."

  if User.exists?(email: p[:email])
    puts ' já existe, pulando.'
    skipped += 1
    next
  end

  begin
    ActiveRecord::Base.transaction do
      user = User.new(
        email: p[:email], first_name: p[:first_name], last_name: p[:last_name],
        password: 'nutri123', password_confirmation: 'nutri123',
        confirmed_at: Time.current, accepted_terms_at: Time.current,
        accepted_privacy_at: Time.current, terms_of_service: '1',
        preferred_language: 'pt-BR'
      )
      user.skip_confirmation!
      user.save!

      account = user.reload.account
      company = account.company
      company.update!(screen_name: p[:business_name])

      addr = p[:address]
      company.addresses.create!(
        address_line1: addr[:line1],
        district:      addr[:district],
        city:          addr[:city],
        state:         addr[:state],
        postcode:      addr[:postcode],
        country:       'BR',
        latitude:      addr[:lat],
        longitude:     addr[:lng]
      )

      account.update!(
        directory_visible:     true,
        profession_category:   'Nutricionista',
        directory_description: p[:description],
        specialties:           p[:specialties],
        instagram_url:         p[:instagram_url],
        subscription_status:   'active'
      )

      p[:services].each do |svc|
        account.services.create!(
          name: svc[:name], selling_price_cents: svc[:price],
          currency: 'BRL', enabled: true,
          metadata: { duration_minutes: svc[:duration], modality: svc[:modality] }
        )
      end

      account.appointment_links.create!(
        name: "Agendar com #{p[:business_name]}",
        token: SecureRandom.hex(16), active: true, settings: {}
      )

      # Fotos
      logo_url  = "https://randomuser.me/api/portraits/#{p[:photo_gender]}/#{p[:photo_index]}.jpg"
      cover_url = "https://picsum.photos/seed/nutri#{cover_seed}/1200/400"
      attach_photo(company, :logo,        logo_url,  "logo_#{p[:photo_gender]}_#{p[:photo_index]}.jpg")
      attach_photo(company, :cover_image, cover_url, "cover_nutri#{cover_seed}.jpg")

      puts " ✅ #{addr[:district]}, #{addr[:city]}"
      created += 1
    end
  rescue => e
    puts " ❌ #{e.message}"
    errors += 1
  end
end

puts "\n#{'='*70}"
puts "✅ Criados: #{created}  |  ⏭ Pulados: #{skipped}  |  ❌ Erros: #{errors}"
puts "#{'='*70}\n"
