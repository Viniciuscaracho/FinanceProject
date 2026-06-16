# frozen_string_literal: true
#
# Gerador de 80 nutricionistas demo — SP e região
# Execute: bundle exec rails runner db/seeds/nutri_sp_bulk.rb
#
# 50% com foto (randomuser.me, índices não usados), 50% só avatar
# Nomes, bairros, CRNs e trust signals gerados programaticamente

require 'open-uri'

User.class_eval    { def verify_email_address; end }
Company.class_eval { def verify_email_address; end }

# ── Nomes ──────────────────────────────────────────────────────────────────
FEMALE_FIRST = %w[
  Adriana Alessandra Aline Amanda Andréia Angela Bianca Bruna Carina Carolina
  Clarice Claudia Cláudia Cristiane Débora Denise Diana Eduarda Elaine Eliane
  Elisa Erica Estela Flávia Francine Gisele Giovana Glaucia Helena Ingrid
  Jéssica Joana Josiane Karina Katia Letícia Lilian Lorena Luciana Luísa
  Maíra Marcela Marcia Mariane Mayara Micheli Milena Mirela Monique Nathalia
  Natasha Nilza Paola Patrícia Priscila Roberta Rosana Sabrina Samara Simone
  Solange Suelen Taís Talita Tatiane Thamiris Valdirene Verônica Viviane
].freeze

MALE_FIRST = %w[
  Adriano Alessandro Alexandre Allan Anderson Bruno Caio Carlos Cesar Cláudio
  Daniel David Douglas Eduardo Evandro Fábio Felipe Fernando Flávio Francisco
  Gabriel Giovani Guilherme Gustavo Hugo Iago Igor Ivan João Jorge José Júnior
  Leandro Leonardo Luan Luís Marcelo Marco Mateus Mauricio Murilo Paulo Pedro
  Ricardo Roberto Rodrigo Saulo Sergio Thiago Tiago Victor Vitor Wagner Yuri
].freeze

LAST_NAMES = %w[
  Abreu Aguiar Almeida Alves Amaro Andrade Araújo Assunção Azevedo Barbosa
  Barros Batista Borges Braga Bueno Cabral Caetano Calixto Campos Cardoso
  Carmo Carvalho Castro Cavalcante Cerqueira Correia Costa Cruz Cunha Dantas
  Dias Duarte Esteves Faria Farias Ferreira Figueiredo Freire Freitas Gomes
  Gonçalves Guimarães Henrique Lacerda Leal Lima Lopes Macedo Machado Maia
  Marques Martins Medeiros Melo Mendes Miranda Monteiro Moraes Moreira Mota
  Muniz Nascimento Neves Nogueira Nunes Oliveira Pacheco Paiva Passos Pereira
  Pinheiro Pinto Ramos Reis Ribeiro Rocha Rodrigues Sá Sales Santos Saraiva
  Sena Silva Silveira Simões Soares Souza Tavares Teixeira Torres Vasconcelos
  Vieira Zanini
].freeze

# ── Bairros SP + região ────────────────────────────────────────────────────
NEIGHBORHOODS = [
  { street_prefix: 'Rua Deputado Lacerda Franco',   number: '200',  district: 'Morumbi',           city: 'São Paulo',            state: 'SP', postcode: '05653-010', lat: -23.6183, lng: -46.7148 },
  { street_prefix: 'Rua Olimpíadas',                number: '66',   district: 'Vila Olímpia',       city: 'São Paulo',            state: 'SP', postcode: '04551-000', lat: -23.5960, lng: -46.6842 },
  { street_prefix: 'Av. Santo Amaro',               number: '2337', district: 'Santo Amaro',        city: 'São Paulo',            state: 'SP', postcode: '04743-002', lat: -23.6516, lng: -46.7049 },
  { street_prefix: 'Rua Jabaquara',                 number: '820',  district: 'Jabaquara',           city: 'São Paulo',            state: 'SP', postcode: '04045-003', lat: -23.6661, lng: -46.6375 },
  { street_prefix: 'Rua Condessa de São Joaquim',   number: '151',  district: 'Saúde',              city: 'São Paulo',            state: 'SP', postcode: '04143-030', lat: -23.6131, lng: -46.6252 },
  { street_prefix: 'Rua Vergueiro',                 number: '3985', district: 'Vila Mariana',       city: 'São Paulo',            state: 'SP', postcode: '04101-300', lat: -23.5870, lng: -46.6330 },
  { street_prefix: 'Rua da Glória',                 number: '225',  district: 'Aclimação',          city: 'São Paulo',            state: 'SP', postcode: '01531-001', lat: -23.5715, lng: -46.6300 },
  { street_prefix: 'Rua da Liberdade',              number: '180',  district: 'Liberdade',          city: 'São Paulo',            state: 'SP', postcode: '01503-010', lat: -23.5591, lng: -46.6337 },
  { street_prefix: 'Av. Paulista',                  number: '726',  district: 'Consolação',         city: 'São Paulo',            state: 'SP', postcode: '01310-100', lat: -23.5529, lng: -46.6601 },
  { street_prefix: 'Rua Catão',                     number: '543',  district: 'Lapa',               city: 'São Paulo',            state: 'SP', postcode: '05049-000', lat: -23.5232, lng: -46.7030 },
  { street_prefix: 'Av. Professor Francisco Morato','number': '1800', district: 'Butantã',          city: 'São Paulo',            state: 'SP', postcode: '05521-200', lat: -23.5744, lng: -46.7194 },
  { street_prefix: 'Rua Silva Bueno',               number: '1001', district: 'Ipiranga',           city: 'São Paulo',            state: 'SP', postcode: '04208-060', lat: -23.5955, lng: -46.6124 },
  { street_prefix: 'Av. Paes de Barros',            number: '800',  district: 'Mooca',              city: 'São Paulo',            state: 'SP', postcode: '03115-000', lat: -23.5617, lng: -46.6003 },
  { street_prefix: 'Rua Baronesa de Itu',           number: '319',  district: 'Higienópolis',       city: 'São Paulo',            state: 'SP', postcode: '01231-001', lat: -23.5457, lng: -46.6612 },
  { street_prefix: 'Rua Penha de França',           number: '1542', district: 'Penha',              city: 'São Paulo',            state: 'SP', postcode: '03634-001', lat: -23.5333, lng: -46.5400 },
  { street_prefix: 'Av. General Ataliba Leonel',    number: '700',  district: 'Tucuruvi',           city: 'São Paulo',            state: 'SP', postcode: '02304-001', lat: -23.4826, lng: -46.6132 },
  { street_prefix: 'Rua Casa Verde',                number: '450',  district: 'Casa Verde',         city: 'São Paulo',            state: 'SP', postcode: '02519-001', lat: -23.5064, lng: -46.6587 },
  { street_prefix: 'Rua Guilherme de Almeida',      number: '303',  district: 'Vila Guilherme',     city: 'São Paulo',            state: 'SP', postcode: '02120-010', lat: -23.5144, lng: -46.5971 },
  { street_prefix: 'Rua Comendador Martinelli',     number: '210',  district: 'Pirituba',           city: 'São Paulo',            state: 'SP', postcode: '05111-020', lat: -23.4949, lng: -46.7206 },
  { street_prefix: 'Av. Mandaqui',                  number: '1100', district: 'Mandaqui',           city: 'São Paulo',            state: 'SP', postcode: '02401-001', lat: -23.4760, lng: -46.6276 },
  { street_prefix: 'Rua Belém',                     number: '744',  district: 'Belém',              city: 'São Paulo',            state: 'SP', postcode: '03059-010', lat: -23.5475, lng: -46.5783 },
  { street_prefix: 'Rua Água Rasa',                 number: '390',  district: 'Água Rasa',          city: 'São Paulo',            state: 'SP', postcode: '03352-000', lat: -23.5543, lng: -46.5803 },
  { street_prefix: 'Rua Borges de Figueiredo',      number: '222',  district: 'Mooca',              city: 'São Paulo',            state: 'SP', postcode: '03110-010', lat: -23.5580, lng: -46.6050 },
  { street_prefix: 'Av. Raja Gabaglia',             number: '1143', district: 'Morumbi',            city: 'São Paulo',            state: 'SP', postcode: '05663-000', lat: -23.6210, lng: -46.7200 },
  { street_prefix: 'Rua João Cachoeira',            number: '500',  district: 'Itaim Bibi',         city: 'São Paulo',            state: 'SP', postcode: '04535-012', lat: -23.5880, lng: -46.6760 },
  { street_prefix: 'Av. Washington Luís',           number: '3500', district: 'Campo Belo',         city: 'São Paulo',            state: 'SP', postcode: '04626-003', lat: -23.6200, lng: -46.6590 },
  { street_prefix: 'Rua Dr. Bacelar',               number: '1028', district: 'Vila Clementino',    city: 'São Paulo',            state: 'SP', postcode: '04026-002', lat: -23.5941, lng: -46.6425 },
  { street_prefix: 'Av. André Araujo',              number: '445',  district: 'Centro',             city: 'Guarulhos',            state: 'SP', postcode: '07010-010', lat: -23.4543, lng: -46.5329 },
  { street_prefix: 'Rua Senador Fláquer',           number: '120',  district: 'Centro',             city: 'Santo André',          state: 'SP', postcode: '09010-160', lat: -23.6639, lng: -46.5384 },
  { street_prefix: 'Av. Kennedy',                   number: '900',  district: 'Nova Petrópolis',    city: 'São Bernardo do Campo', state: 'SP', postcode: '09750-000', lat: -23.6939, lng: -46.5650 },
  { street_prefix: 'Av. dos Autonomistas',          number: '1300', district: 'Centro',             city: 'Osasco',               state: 'SP', postcode: '06016-100', lat: -23.5329, lng: -46.7919 },
  { street_prefix: 'Rua Graça Aranha',              number: '67',   district: 'Diadema',            city: 'Diadema',              state: 'SP', postcode: '09941-240', lat: -23.6860, lng: -46.6157 },
].freeze

# ── Especialidades e descrições ────────────────────────────────────────────
SPECIALTY_SETS = [
  { specs: ['emagrecimento'],              focus: 'emagrecimento sustentável e reeducação alimentar' },
  { specs: ['esportiva', 'emagrecimento'], focus: 'nutrição esportiva e performance atlética' },
  { specs: ['saúde feminina'],             focus: 'saúde hormonal feminina e bem-estar integral' },
  { specs: ['gestação', 'infantil'],       focus: 'nutrição na gestação e alimentação infantil' },
  { specs: ['vegetariana', 'online'],      focus: 'alimentação plant-based e veganismo saudável' },
  { specs: ['emagrecimento', 'online'],    focus: 'emagrecimento comportamental com atendimento online' },
  { specs: ['esportiva'],                  focus: 'hipertrofia, recomposição corporal e suplementação' },
  { specs: ['infantil'],                   focus: 'nutrição pediátrica e introdução alimentar' },
  { specs: ['saúde feminina', 'hormonal'], focus: 'SOP, endometriose e saúde hormonal feminina' },
  { specs: ['emagrecimento'],              focus: 'nutrição clínica e controle de peso duradouro' },
].freeze

DESCRIPTION_TEMPLATES = [
  'Nutricionista com %d anos de experiência em %s. Atendimento individualizado baseado em exames e estilo de vida do paciente. Presencial em %s e online para todo o Brasil.',
  'Especialista em %s. Mais de %d pacientes acompanhados com resultados comprovados. Abordagem humanizada e baseada em evidências científicas.',
  'Nutricionista clínica e funcional com foco em %s. Formada pela USP com especialização em nutrição integrativa. Atendimento personalizado em %s.',
  'Apaixonada por %s, ajudo meus pacientes a transformar sua relação com a comida de forma prazerosa e sem restrições desnecessárias. %d+ consultas realizadas.',
  'Nutricionista com pós-graduação em %s. Trabalho com protocolos individualizados para cada paciente, considerando rotina, preferências e objetivos. Atendo em %s.',
  'Especialista em %s com abordagem integrativa e funcional. Cada plano alimentar é único, construído junto com o paciente para garantir adesão e resultados duradouros.',
  'Com %d anos dedicados à %s, desenvolvi um método próprio que combina ciência, praticidade e prazer à mesa. Atendo presencialmente em %s e online.',
  'Nutricionista focada em %s. Atendimento acolhedor e individualizado, com foco em qualidade de vida e saúde a longo prazo. %d pacientes transformados.',
].freeze

# ── Helpers ────────────────────────────────────────────────────────────────
def gen_crn
  "CRN-3 #{rand(40_000..79_999)}/P"
end

def gen_phone
  ddd    = %w[11 11 11 11 11 11 13 14 15 16 17 18 19].sample
  prefix = %w[9 9 9 9 98 97 96 95].sample
  rest   = rand(1000..9999)
  mid    = rand(1000..9999)
  "(#{ddd}) #{prefix}#{rest}-#{mid}"
end

def gen_description(focus, district, years, patients)
  tpl = DESCRIPTION_TEMPLATES.sample
  begin
    tpl % [years, focus, district, patients]
  rescue ArgumentError
    begin
      tpl % [focus, patients, district]
    rescue ArgumentError
      begin
        tpl % [focus, years, district]
      rescue ArgumentError
        "Nutricionista especializada em #{focus}. Atendimento presencial em #{district} e online para todo o Brasil. #{patients}+ pacientes atendidos."
      end
    end
  end
end

def gen_services(specs)
  base = [{ name: 'Consulta Nutricional', price: rand(180..320) * 100, duration: 60, modality: 'presencial' }]

  if specs.include?('esportiva')
    base << { name: 'Avaliação Esportiva', price: rand(280..400) * 100, duration: 75, modality: 'presencial' }
    base << { name: 'Plano de Performance', price: rand(400..650) * 100, duration: 90, modality: 'online' }
  elsif specs.include?('gestação') || specs.include?('infantil')
    base << { name: specs.include?('gestação') ? 'Nutrição na Gestação' : 'Consulta Infantil', price: rand(220..320) * 100, duration: 60, modality: 'presencial' }
    base << { name: 'Retorno Online', price: rand(120..180) * 100, duration: 40, modality: 'online' }
  elsif specs.include?('vegetariana')
    base << { name: 'Cardápio Plant-Based', price: rand(350..500) * 100, duration: 75, modality: 'online' }
    base << { name: 'Retorno', price: rand(110..160) * 100, duration: 40, modality: 'online' }
  else
    base << { name: 'Plano Alimentar Completo', price: rand(350..550) * 100, duration: 90, modality: 'online' }
    base << { name: 'Retorno / Acompanhamento', price: rand(120..200) * 100, duration: 45, modality: 'online' }
  end

  base
end

def attach_photo_bulk(company, method_name, url, filename)
  io   = URI.open(url, 'rb', read_timeout: 15, open_timeout: 10)
  blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: filename, content_type: 'image/jpeg')
  ActiveStorage::Attachment.where(
    record_type: company.class.polymorphic_name,
    record_id:   company.id,
    name:        method_name.to_s
  ).delete_all
  ActiveStorage::Attachment.create!(
    record_type: company.class.polymorphic_name,
    record_id:   company.id,
    name:        method_name.to_s,
    blob_id:     blob.id
  )
  true
rescue => e
  puts "    ⚠️  #{method_name} falhou: #{e.message}"
  false
end

# ── Geração dos perfis ─────────────────────────────────────────────────────
# 80 perfis: 44 mulheres, 36 homens
# Fotos: mulheres índices 14..57, homens índices 8..43 (alternados para 50%)
PROFILES = []

# Mulheres (44)
female_photo_indices = (14..57).to_a  # 44 índices disponíveis
44.times do |i|
  first = FEMALE_FIRST.sample
  last  = LAST_NAMES.sample
  nb    = NEIGHBORHOODS[i % NEIGHBORHOODS.size]
  sset  = SPECIALTY_SETS[i % SPECIALTY_SETS.size]
  years = rand(3..18)
  pts   = rand(80..950)

  has_photo = i.even?  # ~50% com foto
  PROFILES << {
    gender:    'women',
    photo_idx: has_photo ? female_photo_indices[i] : nil,
    first_name: first,
    last_name:  last,
    email:     "#{first.downcase.unicode_normalize(:nfd).encode('ASCII', replace: '').gsub(/[^a-z]/,'')}.#{last.downcase.unicode_normalize(:nfd).encode('ASCII', replace: '').gsub(/[^a-z]/,'')}.#{i}f@discover-demo.orbi",
    business_name: ["#{first} #{last} Nutrição",
                    "Dra. #{first} #{last}",
                    "#{first} #{last} — #{sset[:specs].first.capitalize}",
                    "Nutrição #{last}"].sample,
    phone:         gen_phone,
    crn:           gen_crn,
    description:   gen_description(sset[:focus], nb[:district], years, pts),
    specialties:   sset[:specs],
    address:       { line1: "#{nb[:street_prefix]}, #{nb[:number]}", district: nb[:district], city: nb[:city], state: nb[:state], postcode: nb[:postcode], lat: nb[:lat] + rand(-0.005..0.005).round(4), lng: nb[:lng] + rand(-0.005..0.005).round(4) },
    services:      gen_services(sset[:specs]),
    ratings_count: rand(22..220),
    ratings_avg:   (rand(45..50) / 10.0),
    patients:      pts,
  }
end

# Homens (36)
male_photo_indices = (8..43).to_a
36.times do |i|
  first = MALE_FIRST.sample
  last  = LAST_NAMES.sample
  nb    = NEIGHBORHOODS[(i + 11) % NEIGHBORHOODS.size]
  sset  = SPECIALTY_SETS[(i + 2) % SPECIALTY_SETS.size]
  years = rand(3..18)
  pts   = rand(80..950)

  has_photo = i.even?
  PROFILES << {
    gender:    'men',
    photo_idx: has_photo ? male_photo_indices[i] : nil,
    first_name: first,
    last_name:  last,
    email:     "#{first.downcase.unicode_normalize(:nfd).encode('ASCII', replace: '').gsub(/[^a-z]/,'')}.#{last.downcase.unicode_normalize(:nfd).encode('ASCII', replace: '').gsub(/[^a-z]/,'')}.#{i}m@discover-demo.orbi",
    business_name: ["#{first} #{last} Nutrição",
                    "Dr. #{first} #{last}",
                    "#{first} #{last} Performance",
                    "#{first} #{last} — #{sset[:specs].first.capitalize}"].sample,
    phone:         gen_phone,
    crn:           gen_crn,
    description:   gen_description(sset[:focus], nb[:district], years, pts),
    specialties:   sset[:specs],
    address:       { line1: "#{nb[:street_prefix]}, #{nb[:number]}", district: nb[:district], city: nb[:city], state: nb[:state], postcode: nb[:postcode], lat: nb[:lat] + rand(-0.005..0.005).round(4), lng: nb[:lng] + rand(-0.005..0.005).round(4) },
    services:      gen_services(sset[:specs]),
    ratings_count: rand(18..180),
    ratings_avg:   (rand(44..50) / 10.0),
    patients:      pts,
  }
end

# ── Execução ───────────────────────────────────────────────────────────────
puts "\n#{'='*70}"
puts "🥦 GERANDO #{PROFILES.size} NUTRICIONISTAS — SP e REGIÃO"
puts "#{'='*70}\n"

created = 0; skipped = 0; errors = 0; photos_ok = 0

PROFILES.each_with_index do |p, idx|
  print "#{idx + 1}/#{PROFILES.size} #{p[:business_name]}..."

  if User.exists?(email: p[:email])
    puts ' já existe.'
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

      company.update!(screen_name: p[:business_name], cell_phone_number: p[:phone])

      addr = p[:address]
      company.addresses.create!(
        address_line1: addr[:line1], district: addr[:district],
        city: addr[:city], state: addr[:state], postcode: addr[:postcode],
        country: 'BR', latitude: addr[:lat], longitude: addr[:lng]
      )

      account.update!(
        directory_visible:         true,
        profession_category:       'Nutricionista',
        directory_description:     p[:description],
        specialties:               p[:specialties],
        professional_registration: p[:crn],
        subscription_status:       'active',
        preferences: {
          'ratings_count'   => p[:ratings_count],
          'ratings_average' => p[:ratings_avg],
          'patients_count'  => p[:patients],
        }
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

      # Foto (50% dos perfis)
      if p[:photo_idx]
        logo_url = "https://randomuser.me/api/portraits/#{p[:gender]}/#{p[:photo_idx]}.jpg"
        ok = attach_photo_bulk(company, :logo, logo_url, "logo_#{p[:gender]}_#{p[:photo_idx]}.jpg")
        photos_ok += 1 if ok
      end

      cover_url = "https://picsum.photos/seed/sp#{idx + 100}/1200/400"
      attach_photo_bulk(company, :cover_image, cover_url, "cover_sp#{idx + 100}.jpg")

      print " #{addr[:district]}, #{addr[:city]}"
      print p[:photo_idx] ? ' 📸' : ' 👤'
      puts
      created += 1
    end
  rescue => e
    puts " ❌ #{e.message[0..80]}"
    errors += 1
  end
end

puts "\n#{'='*70}"
puts "✅ Criados: #{created}  |  📸 Com foto: #{photos_ok}  |  ⏭ Pulados: #{skipped}  |  ❌ Erros: #{errors}"
puts "#{'='*70}\n"
