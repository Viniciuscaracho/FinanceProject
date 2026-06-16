# frozen_string_literal: true
#
# Gerador de 80 nutricionistas demo — SP e região
# 50% com foto — fonte: Pexels (CDN direto, sem API key)

require 'open-uri'

User.class_eval    { def verify_email_address; end }
Company.class_eval { def verify_email_address; end }

# ── Fotos Pexels curadas ───────────────────────────────────────────────────

PEXELS_WOMEN = [
  774909,  1239291, 415829,  762020,  1065084,
  733872,  1587009, 2379005, 1181690, 3756679,
  712513,  3764119, 5327585, 2709388, 1181686,
  3184405, 3762875, 1197132, 1130626, 2379004,
  1181695, 3764565,
].freeze

PEXELS_MEN = [
  220453,  614810,  1222271, 91227,   432059,
  1212984, 2182970, 3785079, 1681010, 1043471,
  3778603, 2422280, 2897883, 3785104, 1516680,
  1080213, 2379003,
].freeze

def pexels_url(gender, pool_idx)
  pool = gender == 'women' ? PEXELS_WOMEN : PEXELS_MEN
  id   = pool[pool_idx % pool.size]
  "https://images.pexels.com/photos/#{id}/pexels-photo-#{id}.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=400&w=400"
end

# ── Nomes ──────────────────────────────────────────────────────────────────
FEMALE_FIRST = %w[
  Adriana Alessandra Aline Amanda Andréia Bianca Bruna Carina Carolina Clarice
  Claudia Cristiane Débora Denise Eduarda Elaine Eliana Elisa Erica Estela
  Flávia Francine Gisele Giovana Helena Ingrid Jéssica Joana Josiane Karina
  Katia Letícia Lilian Lorena Luciana Luísa Maíra Marcela Marcia Mariane
  Mayara Micheli Milena Monique Nathalia Natasha Nilza Paola Priscila Roberta
  Rosana Sabrina Samara Simone Solange Suelen Taís Talita Tatiane Thamiris
  Valdirene Verônica Viviane
].freeze

MALE_FIRST = %w[
  Adriano Alessandro Alexandre Anderson Bruno Caio Carlos Cesar Cláudio Daniel
  David Douglas Eduardo Evandro Fábio Flávio Francisco Gabriel Giovani
  Guilherme Gustavo Hugo Iago Igor Ivan João Jorge José Júnior Leandro
  Leonardo Luan Luís Marcelo Marco Mateus Mauricio Murilo Paulo Pedro Ricardo
  Roberto Rodrigo Saulo Sergio Thiago Tiago Victor Vitor Wagner Yuri
].freeze

LAST_NAMES = %w[
  Abreu Aguiar Almeida Alves Amaro Andrade Araújo Azevedo Barbosa Barros
  Batista Borges Braga Bueno Cabral Caetano Campos Cardoso Carmo Carvalho
  Castro Cavalcante Correia Costa Cruz Cunha Dantas Dias Duarte Esteves Faria
  Farias Ferreira Figueiredo Freire Freitas Gomes Gonçalves Guimarães Lacerda
  Leal Lima Lopes Macedo Machado Maia Marques Martins Medeiros Melo Mendes
  Miranda Monteiro Moraes Moreira Mota Muniz Nascimento Neves Nogueira Nunes
  Oliveira Pacheco Paiva Passos Pereira Pinheiro Pinto Ramos Reis Ribeiro
  Rocha Rodrigues Sá Sales Santos Saraiva Sena Silva Silveira Simões Soares
  Souza Tavares Teixeira Torres Vasconcelos Vieira Zanini
].freeze

# ── Bairros SP + região ────────────────────────────────────────────────────
NEIGHBORHOODS = [
  { street: 'Rua Deputado Lacerda Franco',    n: '200',  d: 'Morumbi',            c: 'São Paulo',              s: 'SP', p: '05653-010', lat: -23.6183, lng: -46.7148 },
  { street: 'Rua Olimpíadas',                 n: '66',   d: 'Vila Olímpia',        c: 'São Paulo',              s: 'SP', p: '04551-000', lat: -23.5960, lng: -46.6842 },
  { street: 'Av. Santo Amaro',                n: '2337', d: 'Santo Amaro',         c: 'São Paulo',              s: 'SP', p: '04743-002', lat: -23.6516, lng: -46.7049 },
  { street: 'Rua Jabaquara',                  n: '820',  d: 'Jabaquara',           c: 'São Paulo',              s: 'SP', p: '04045-003', lat: -23.6661, lng: -46.6375 },
  { street: 'Rua Condessa de São Joaquim',    n: '151',  d: 'Saúde',              c: 'São Paulo',              s: 'SP', p: '04143-030', lat: -23.6131, lng: -46.6252 },
  { street: 'Rua da Glória',                  n: '225',  d: 'Aclimação',          c: 'São Paulo',              s: 'SP', p: '01531-001', lat: -23.5715, lng: -46.6300 },
  { street: 'Rua da Liberdade',               n: '180',  d: 'Liberdade',          c: 'São Paulo',              s: 'SP', p: '01503-010', lat: -23.5591, lng: -46.6337 },
  { street: 'Av. Paulista',                   n: '726',  d: 'Consolação',         c: 'São Paulo',              s: 'SP', p: '01310-100', lat: -23.5529, lng: -46.6601 },
  { street: 'Rua Catão',                      n: '543',  d: 'Lapa',               c: 'São Paulo',              s: 'SP', p: '05049-000', lat: -23.5232, lng: -46.7030 },
  { street: 'Av. Professor Francisco Morato', n: '1800', d: 'Butantã',            c: 'São Paulo',              s: 'SP', p: '05521-200', lat: -23.5744, lng: -46.7194 },
  { street: 'Rua Silva Bueno',                n: '1001', d: 'Ipiranga',           c: 'São Paulo',              s: 'SP', p: '04208-060', lat: -23.5955, lng: -46.6124 },
  { street: 'Av. Paes de Barros',             n: '800',  d: 'Mooca',              c: 'São Paulo',              s: 'SP', p: '03115-000', lat: -23.5617, lng: -46.6003 },
  { street: 'Rua Baronesa de Itu',            n: '319',  d: 'Higienópolis',       c: 'São Paulo',              s: 'SP', p: '01231-001', lat: -23.5457, lng: -46.6612 },
  { street: 'Rua Penha de França',            n: '1542', d: 'Penha',              c: 'São Paulo',              s: 'SP', p: '03634-001', lat: -23.5333, lng: -46.5400 },
  { street: 'Av. General Ataliba Leonel',     n: '700',  d: 'Tucuruvi',           c: 'São Paulo',              s: 'SP', p: '02304-001', lat: -23.4826, lng: -46.6132 },
  { street: 'Rua Casa Verde',                 n: '450',  d: 'Casa Verde',         c: 'São Paulo',              s: 'SP', p: '02519-001', lat: -23.5064, lng: -46.6587 },
  { street: 'Rua Guilherme de Almeida',       n: '303',  d: 'Vila Guilherme',     c: 'São Paulo',              s: 'SP', p: '02120-010', lat: -23.5144, lng: -46.5971 },
  { street: 'Rua Comendador Martinelli',      n: '210',  d: 'Pirituba',           c: 'São Paulo',              s: 'SP', p: '05111-020', lat: -23.4949, lng: -46.7206 },
  { street: 'Av. Mandaqui',                   n: '1100', d: 'Mandaqui',           c: 'São Paulo',              s: 'SP', p: '02401-001', lat: -23.4760, lng: -46.6276 },
  { street: 'Rua Belém',                      n: '744',  d: 'Belém',              c: 'São Paulo',              s: 'SP', p: '03059-010', lat: -23.5475, lng: -46.5783 },
  { street: 'Rua Água Rasa',                  n: '390',  d: 'Água Rasa',          c: 'São Paulo',              s: 'SP', p: '03352-000', lat: -23.5543, lng: -46.5803 },
  { street: 'Av. Raja Gabaglia',              n: '1143', d: 'Morumbi',            c: 'São Paulo',              s: 'SP', p: '05663-000', lat: -23.6210, lng: -46.7200 },
  { street: 'Rua João Cachoeira',             n: '500',  d: 'Itaim Bibi',         c: 'São Paulo',              s: 'SP', p: '04535-012', lat: -23.5880, lng: -46.6760 },
  { street: 'Av. Washington Luís',            n: '3500', d: 'Campo Belo',         c: 'São Paulo',              s: 'SP', p: '04626-003', lat: -23.6200, lng: -46.6590 },
  { street: 'Rua Dr. Bacelar',                n: '1028', d: 'Vila Clementino',    c: 'São Paulo',              s: 'SP', p: '04026-002', lat: -23.5941, lng: -46.6425 },
  { street: 'Av. André Araujo',               n: '445',  d: 'Centro',             c: 'Guarulhos',              s: 'SP', p: '07010-010', lat: -23.4543, lng: -46.5329 },
  { street: 'Rua Senador Fláquer',            n: '120',  d: 'Centro',             c: 'Santo André',            s: 'SP', p: '09010-160', lat: -23.6639, lng: -46.5384 },
  { street: 'Av. Kennedy',                    n: '900',  d: 'Nova Petrópolis',    c: 'São Bernardo do Campo',  s: 'SP', p: '09750-000', lat: -23.6939, lng: -46.5650 },
  { street: 'Av. dos Autonomistas',           n: '1300', d: 'Centro',             c: 'Osasco',                 s: 'SP', p: '06016-100', lat: -23.5329, lng: -46.7919 },
  { street: 'Rua Graça Aranha',               n: '67',   d: 'Centro',             c: 'Diadema',                s: 'SP', p: '09941-240', lat: -23.6860, lng: -46.6157 },
  { street: 'Rua Voluntários da Pátria',      n: '1818', d: 'Santana',            c: 'São Paulo',              s: 'SP', p: '02011-000', lat: -23.5009, lng: -46.6279 },
  { street: 'Rua Borges de Figueiredo',       n: '222',  d: 'Mooca',              c: 'São Paulo',              s: 'SP', p: '03110-010', lat: -23.5580, lng: -46.6050 },
].freeze

# ── Especialidades por gênero ──────────────────────────────────────────────
FEMALE_SPECIALTIES = [
  { specs: ['emagrecimento'],              focus: 'emagrecimento sustentável e reeducação alimentar' },
  { specs: ['esportiva', 'emagrecimento'], focus: 'nutrição esportiva e performance atlética' },
  { specs: ['saúde feminina'],             focus: 'saúde hormonal feminina e bem-estar integral' },
  { specs: ['gestação', 'infantil'],       focus: 'nutrição na gestação e alimentação infantil' },
  { specs: ['vegetariana', 'online'],      focus: 'alimentação plant-based e veganismo saudável' },
  { specs: ['emagrecimento', 'online'],    focus: 'emagrecimento comportamental com atendimento online' },
  { specs: ['infantil'],                   focus: 'nutrição pediátrica e introdução alimentar' },
  { specs: ['saúde feminina', 'hormonal'], focus: 'SOP, endometriose e saúde hormonal feminina' },
  { specs: ['emagrecimento'],              focus: 'nutrição clínica e controle de peso duradouro' },
  { specs: ['vegetariana'],               focus: 'alimentação vegana e saúde preventiva' },
].freeze

MALE_SPECIALTIES = [
  { specs: ['emagrecimento'],              focus: 'emagrecimento sustentável e reeducação alimentar' },
  { specs: ['esportiva', 'emagrecimento'], focus: 'nutrição esportiva e performance atlética' },
  { specs: ['esportiva'],                  focus: 'hipertrofia, recomposição corporal e suplementação' },
  { specs: ['vegetariana', 'online'],      focus: 'alimentação plant-based e veganismo saudável' },
  { specs: ['emagrecimento', 'online'],    focus: 'emagrecimento comportamental com atendimento online' },
  { specs: ['infantil'],                   focus: 'nutrição pediátrica e introdução alimentar' },
  { specs: ['emagrecimento'],              focus: 'nutrição clínica e controle de peso duradouro' },
  { specs: ['esportiva'],                  focus: 'performance, força e periodização nutricional' },
].freeze

DESCRIPTION_TEMPLATES = [
  'Nutricionista com %d anos de experiência em %s. Atendimento individualizado baseado em exames e estilo de vida. Presencial em %s e online para todo o Brasil.',
  'Especialista em %s com mais de %d pacientes acompanhados. Abordagem humanizada, baseada em evidências e adaptada à rotina de cada pessoa.',
  'Nutricionista clínica e funcional com foco em %s. Formação USP com pós-graduação em nutrição integrativa. Atendimento em %s.',
  'Apaixonada por %s, ajudo meus pacientes a transformar a relação com a comida de forma prazerosa. Mais de %d consultas realizadas.',
  'Nutricionista com pós-graduação em %s. Protocolos individualizados considerando rotina, preferências e objetivos. Atendo em %s.',
  'Com %d anos dedicados à %s, desenvolvi um método que combina ciência, praticidade e prazer à mesa. Presencial em %s e online.',
].freeze

def gen_crn  = "CRN-3 #{rand(40_000..79_999)}/P"
def gen_phone
  ddd = %w[11 11 11 11 11 13 14 15 19].sample
  "(#{ddd}) 9#{rand(1000..9999)}-#{rand(1000..9999)}"
end

def gen_description(focus, district, years, patients)
  tpl = DESCRIPTION_TEMPLATES.sample
  parts = [years, focus, district, patients, focus, patients, district, years]
  filled = tpl % parts.first(tpl.count('%'))
  filled
rescue
  "Nutricionista especializada em #{focus}. Atendimento presencial em #{district} e online. #{patients}+ pacientes atendidos."
end

def gen_services(specs)
  base = [{ name: 'Consulta Nutricional', price: rand(180..320) * 100, duration: 60, modality: 'presencial' }]
  if specs.include?('esportiva')
    base << { name: 'Avaliação Esportiva', price: rand(280..400) * 100, duration: 75, modality: 'presencial' }
    base << { name: 'Plano de Performance', price: rand(400..650) * 100, duration: 90, modality: 'online' }
  elsif specs.include?('infantil')
    base << { name: 'Consulta Infantil', price: rand(220..300) * 100, duration: 60, modality: 'presencial' }
    base << { name: 'Retorno Online', price: rand(110..170) * 100, duration: 40, modality: 'online' }
  elsif specs.include?('vegetariana')
    base << { name: 'Cardápio Plant-Based', price: rand(350..500) * 100, duration: 75, modality: 'online' }
    base << { name: 'Retorno', price: rand(110..160) * 100, duration: 40, modality: 'online' }
  else
    base << { name: 'Plano Alimentar Completo', price: rand(350..550) * 100, duration: 90, modality: 'online' }
    base << { name: 'Retorno / Acompanhamento', price: rand(120..200) * 100, duration: 45, modality: 'online' }
  end
  base
end

def attach_photo_bulk(company, method_name, url)
  io   = URI.open(url, 'rb', read_timeout: 20, open_timeout: 10)
  blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: "#{method_name}.jpg", content_type: 'image/jpeg')
  ActiveStorage::Attachment.where(
    record_type: company.class.polymorphic_name, record_id: company.id, name: method_name.to_s
  ).delete_all
  ActiveStorage::Attachment.create!(
    record_type: company.class.polymorphic_name, record_id: company.id,
    name: method_name.to_s, blob_id: blob.id
  )
  true
rescue => e
  puts "    ⚠️  #{method_name}: #{e.message[0..60]}"
  false
end

# ── Geração de perfis ──────────────────────────────────────────────────────
rng = Random.new(42)  # seed fixo → nomes/bairros reproduzíveis

profiles = []
photo_idx = { 'women' => 0, 'men' => 0 }

44.times do |i|
  nb    = NEIGHBORHOODS[i % NEIGHBORHOODS.size]
  sset  = FEMALE_SPECIALTIES[i % FEMALE_SPECIALTIES.size]
  first = FEMALE_FIRST[rng.rand(FEMALE_FIRST.size)]
  last  = LAST_NAMES[rng.rand(LAST_NAMES.size)]
  slug  = "#{first.downcase.gsub(/[^a-z]/,'')}.#{last.downcase.gsub(/[^a-z]/,'')}.#{i}f"
  pts   = rng.rand(80..950)
  years = rng.rand(3..18)
  has_photo = i.even?

  profiles << {
    gender: 'women', first: first, last: last,
    email: "#{slug}@discover-demo.orbi",
    biz: ["#{first} #{last} Nutrição", "Dra. #{first} #{last}",
          "#{first} #{last} — #{sset[:specs].first.capitalize}"][i % 3],
    phone: gen_phone, crn: gen_crn,
    desc: gen_description(sset[:focus], nb[:d], years, pts),
    specs: sset[:specs], nb: nb, services: gen_services(sset[:specs]),
    rc: rng.rand(20..220), ra: (rng.rand(45..50) / 10.0), pts: pts,
    has_photo: has_photo, pool_idx: (photo_idx['women'].tap { photo_idx['women'] += 1 if has_photo }),
  }
end

36.times do |i|
  nb    = NEIGHBORHOODS[(i + 11) % NEIGHBORHOODS.size]
  sset  = MALE_SPECIALTIES[i % MALE_SPECIALTIES.size]
  first = MALE_FIRST[rng.rand(MALE_FIRST.size)]
  last  = LAST_NAMES[rng.rand(LAST_NAMES.size)]
  slug  = "#{first.downcase.gsub(/[^a-z]/,'')}.#{last.downcase.gsub(/[^a-z]/,'')}.#{i}m"
  pts   = rng.rand(80..950)
  years = rng.rand(3..18)
  has_photo = i.even?

  profiles << {
    gender: 'men', first: first, last: last,
    email: "#{slug}@discover-demo.orbi",
    biz: ["#{first} #{last} Nutrição", "Dr. #{first} #{last}",
          "#{first} #{last} Performance"][i % 3],
    phone: gen_phone, crn: gen_crn,
    desc: gen_description(sset[:focus], nb[:d], years, pts),
    specs: sset[:specs], nb: nb, services: gen_services(sset[:specs]),
    rc: rng.rand(18..180), ra: (rng.rand(44..50) / 10.0), pts: pts,
    has_photo: has_photo, pool_idx: (photo_idx['men'].tap { photo_idx['men'] += 1 if has_photo }),
  }
end

# ── Execução ───────────────────────────────────────────────────────────────
puts "\n#{'='*70}"
puts "🥦 GERANDO #{profiles.size} NUTRICIONISTAS — SP e REGIÃO (fotos: Pexels)"
puts "#{'='*70}\n"

totals = { created: 0, skipped: 0, errors: 0, photos: 0, photo_failed: 0 }

profiles.each_with_index do |p, idx|
  nb = p[:nb]
  print "#{idx + 1}/#{profiles.size} #{p[:biz][0..35]}..."

  if User.exists?(email: p[:email])
    print ' já existe'
    puts
    totals[:skipped] += 1
    next
  end

  begin
    ActiveRecord::Base.transaction do
      user = User.new(
        email: p[:email], first_name: p[:first], last_name: p[:last],
        password: 'nutri123', password_confirmation: 'nutri123',
        confirmed_at: Time.current, accepted_terms_at: Time.current,
        accepted_privacy_at: Time.current, terms_of_service: '1',
        preferred_language: 'pt-BR'
      )
      user.skip_confirmation!
      user.save!

      account = user.reload.account
      company = account.company
      company.update!(screen_name: p[:biz], cell_phone_number: p[:phone])

      company.addresses.create!(
        address_line1: "#{nb[:street]}, #{nb[:n]}", district: nb[:d],
        city: nb[:c], state: nb[:s], postcode: nb[:p], country: 'BR',
        latitude:  nb[:lat] + (rng.rand(-50..50) / 10_000.0),
        longitude: nb[:lng] + (rng.rand(-50..50) / 10_000.0)
      )

      account.update!(
        directory_visible: true, profession_category: 'Nutricionista',
        directory_description: p[:desc], specialties: p[:specs],
        professional_registration: p[:crn], subscription_status: 'active',
        preferences: { 'ratings_count' => p[:rc], 'ratings_average' => p[:ra], 'patients_count' => p[:pts] }
      )

      p[:services].each do |svc|
        account.services.create!(
          name: svc[:name], selling_price_cents: svc[:price],
          currency: 'BRL', enabled: true,
          metadata: { duration_minutes: svc[:duration], modality: svc[:modality] }
        )
      end

      account.appointment_links.create!(
        name: "Agendar com #{p[:biz]}", token: SecureRandom.hex(16),
        active: true, settings: {}
      )

      # Foto logo (50% dos perfis) — Pexels
      has_logo = false
      if p[:has_photo]
        url = pexels_url(p[:gender], p[:pool_idx])
        if attach_photo_bulk(company, :logo, url)
          totals[:photos] += 1
          has_logo = true
        else
          totals[:photo_failed] += 1
        end
      end

      # Cover (todos)
      attach_photo_bulk(company, :cover_image, "https://picsum.photos/seed/sp#{idx + 100}/1200/400")

      print " #{nb[:d]}, #{nb[:c]}"
      print has_logo ? ' 📸' : ' 👤'
      puts
      totals[:created] += 1
    end
  rescue => e
    puts " ❌ #{e.message[0..80]}"
    totals[:errors] += 1
  end
end

puts "\n#{'='*70}"
puts "✅ Criados: #{totals[:created]}  |  ⏭ Pulados: #{totals[:skipped]}  |  ❌ Erros: #{totals[:errors]}"
puts "📸 Fotos OK: #{totals[:photos]}  |  Falhou: #{totals[:photo_failed]}"
puts "#{'='*70}\n"
