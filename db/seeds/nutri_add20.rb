# frozen_string_literal: true
#
# 1. Oculta 20 perfis nutricionistas SEM foto (directory_visible = false)
# 2. Gera 20 novos nutricionistas COM foto — Pexels page 3 (sem sobreposição)
# Execute: bundle exec rails runner db/seeds/nutri_add20.rb

require 'open-uri'
require 'net/http'
require 'json'

User.class_eval    { def verify_email_address; end }
Company.class_eval { def verify_email_address; end }

# ── 1. Ocultar 20 sem foto ─────────────────────────────────────────────────
puts "\n🗑  Ocultando 20 perfis sem foto..."

sem_foto = Account
  .joins(:company)
  .where(directory_visible: true, suspended: false, profession_category: 'Nutricionista')
  .where(discarded_at: nil)
  .where(
    "NOT EXISTS (
      SELECT 1 FROM active_storage_attachments asa
      WHERE asa.record_type = 'Person'
        AND asa.record_id = people.id
        AND asa.name = 'logo'
    )"
  )
  .limit(20)

sem_foto.each do |acc|
  acc.update_column(:directory_visible, false)
  print "  ✗ #{acc.company&.screen_name}\n"
end

puts "  #{sem_foto.size} perfis ocultados.\n"

# ── Pexels API — page 3 ────────────────────────────────────────────────────
def fetch_pexels_ids(query, per_page: 40, page: 3)
  api_key = ENV['PEXELS_API_KEY']
  unless api_key.present?
    puts "⚠️  PEXELS_API_KEY não definida — usando IDs de fallback"
    return []
  end
  uri = URI("https://api.pexels.com/v1/search?query=#{URI.encode_www_form_component(query)}&per_page=#{per_page}&page=#{page}&orientation=square&size=medium")
  req = Net::HTTP::Get.new(uri)
  req['Authorization'] = api_key
  resp = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  data = JSON.parse(resp.body)
  data['photos'].map { |p| p['id'] }
rescue => e
  puts "⚠️  Pexels API erro: #{e.message} — usando fallback"
  []
end

FALLBACK_WOMEN = [
  3768911, 5327585, 4047742, 5327581, 3764569,
  5340284, 3807534, 4225305, 3807554, 3807523,
  4056723, 4056758, 3807544, 5327576, 3764567,
  4841264, 4841291, 3807547, 4047744, 5714174,
].freeze

FALLBACK_MEN = [
  3785077, 1516681, 2897884, 3785074, 1043473,
  2379005, 3778604, 3785080, 1516678, 2897881,
  3785076, 1043475, 91227,   432061,  614812,
  2422282, 1222273, 2182972, 3778605, 1681011,
].freeze

puts "🔍 Buscando fotos no Pexels (page 3)..."
PHOTO_WOMEN = fetch_pexels_ids('professional woman portrait smiling', per_page: 40, page: 3).presence || FALLBACK_WOMEN
PHOTO_MEN   = fetch_pexels_ids('professional man portrait smiling',   per_page: 40, page: 3).presence || FALLBACK_MEN
puts "   #{PHOTO_WOMEN.size} femininas | #{PHOTO_MEN.size} masculinas"

def pexels_url(id)
  "https://images.pexels.com/photos/#{id}/pexels-photo-#{id}.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=400&w=400"
end

# ── Dados ──────────────────────────────────────────────────────────────────
FEMALE_FIRST = %w[Isabela Renata Priscyla Déborah Natália Tatiane Fernanda Camila Aline Monique].freeze
MALE_FIRST   = %w[Gustavo Henrique Marcos Leandro Rafael Eduardo Vitor Thiago Bruno Caio].freeze
LAST_NAMES   = %w[Albuquerque Magalhães Cavalcante Fonseca Monteiro Esteves Brandão Lacerda Paiva Aguiar
                  Queiroz Rezende Sampaio Valente Menezes Maia Tavares Salles Borba Peixoto].freeze

NEIGHBORHOODS = [
  { street: 'Rua Haddock Lobo',        n: '595', d: 'Cerqueira César',   c: 'São Paulo',           s: 'SP', p: '01414-001', lat: -23.5575, lng: -46.6637 },
  { street: 'Rua Estados Unidos',       n: '1121',d: 'Jardins',           c: 'São Paulo',           s: 'SP', p: '01427-001', lat: -23.5700, lng: -46.6648 },
  { street: 'Av. Angélica',            n: '2330',d: 'Higienópolis',      c: 'São Paulo',           s: 'SP', p: '01228-200', lat: -23.5465, lng: -46.6625 },
  { street: 'Rua Vergueiro',            n: '2200',d: 'Paraíso',          c: 'São Paulo',           s: 'SP', p: '04101-000', lat: -23.5794, lng: -46.6330 },
  { street: 'Av. Ibirapuera',           n: '3103',d: 'Moema',            c: 'São Paulo',           s: 'SP', p: '04029-200', lat: -23.6030, lng: -46.6587 },
  { street: 'Rua Pamplona',             n: '816', d: 'Jardim Paulista',   c: 'São Paulo',           s: 'SP', p: '01405-001', lat: -23.5660, lng: -46.6573 },
  { street: 'Av. Brigadeiro Faria Lima',n: '2369',d: 'Itaim Bibi',       c: 'São Paulo',           s: 'SP', p: '01452-000', lat: -23.5873, lng: -46.6825 },
  { street: 'Rua Oscar Freire',         n: '1100',d: 'Pinheiros',        c: 'São Paulo',           s: 'SP', p: '01426-001', lat: -23.5618, lng: -46.6698 },
  { street: 'Rua Cardeal Arcoverde',    n: '2365',d: 'Pinheiros',        c: 'São Paulo',           s: 'SP', p: '05407-001', lat: -23.5644, lng: -46.6875 },
  { street: 'Rua Leopoldo Couto Magalhães', n: '500', d: 'Itaim Bibi',  c: 'São Paulo',           s: 'SP', p: '04542-000', lat: -23.5872, lng: -46.6770 },
  { street: 'Av. Rebouças',            n: '1585',d: 'Pinheiros',        c: 'São Paulo',           s: 'SP', p: '05401-300', lat: -23.5647, lng: -46.6818 },
  { street: 'Rua Tutóia',              n: '900', d: 'Paraíso',          c: 'São Paulo',           s: 'SP', p: '04007-004', lat: -23.5793, lng: -46.6415 },
  { street: 'Av. São Gabriel',          n: '299', d: 'Jardim Paulista',   c: 'São Paulo',           s: 'SP', p: '01435-001', lat: -23.5704, lng: -46.6622 },
  { street: 'Rua Bela Cintra',          n: '1500',d: 'Cerqueira César',   c: 'São Paulo',           s: 'SP', p: '01415-001', lat: -23.5572, lng: -46.6606 },
  { street: 'Rua das Flores',           n: '230', d: 'Centro',            c: 'Campinas',            s: 'SP', p: '13013-140', lat: -22.9046, lng: -47.0621 },
  { street: 'Rua Saldanha Marinho',     n: '880', d: 'Centro',            c: 'Ribeirão Preto',      s: 'SP', p: '14010-400', lat: -21.1775, lng: -47.8101 },
  { street: 'Av. Faria Lima',           n: '1100',d: 'Centro',            c: 'São José dos Campos', s: 'SP', p: '12212-550', lat: -23.1794, lng: -45.8869 },
  { street: 'Rua Tiradentes',           n: '610', d: 'Centro',            c: 'Sorocaba',            s: 'SP', p: '18035-330', lat: -23.5001, lng: -47.4576 },
  { street: 'Av. Dom Pedro I',          n: '333', d: 'Jardim das Nações', c: 'Taubaté',             s: 'SP', p: '12030-010', lat: -23.0199, lng: -45.5559 },
  { street: 'Rua Voluntários da Pátria',n: '440', d: 'Centro',            c: 'Santos',              s: 'SP', p: '11010-200', lat: -23.9345, lng: -46.3210 },
].freeze

SPECIALTIES_POOL = [
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
  'Nutricionista com %d anos de experiência em %s. Atendimento individualizado baseado em exames e estilo de vida. Presencial em %s e online para todo o Brasil.',
  'Especialista em %s com mais de %d pacientes acompanhados. Abordagem humanizada, baseada em evidências e adaptada à rotina de cada pessoa.',
  'Nutricionista clínica e funcional com foco em %s. Formação USP com pós-graduação em nutrição integrativa. Atendimento em %s.',
  'Com %d anos dedicados à %s, desenvolvi um método que combina ciência, praticidade e prazer à mesa. Presencial em %s e online.',
].freeze

def gen_crn  = "CRN-3 #{rand(40_000..79_999)}/P"
def gen_phone
  ddd = %w[11 11 11 11 13 14 15 19].sample
  "(#{ddd}) 9#{rand(1000..9999)}-#{rand(1000..9999)}"
end

def gen_description(focus, district, years, patients)
  tpl   = DESCRIPTION_TEMPLATES.sample
  parts = [years, focus, district, patients, focus, patients, district, years]
  tpl % parts.first(tpl.count('%'))
rescue
  "Nutricionista especializada em #{focus}. Atendimento presencial em #{district} e online."
end

def gen_services(specs)
  base = [{ name: 'Consulta Nutricional', price: rand(180..320) * 100, duration: 60, modality: 'presencial' }]
  if specs.include?('esportiva')
    base << { name: 'Avaliação Esportiva', price: rand(280..400) * 100, duration: 75, modality: 'presencial' }
    base << { name: 'Plano de Performance', price: rand(400..650) * 100, duration: 90, modality: 'online' }
  elsif specs.include?('infantil')
    base << { name: 'Consulta Infantil', price: rand(220..300) * 100, duration: 60, modality: 'presencial' }
    base << { name: 'Retorno Online', price: rand(110..170) * 100, duration: 40, modality: 'online' }
  else
    base << { name: 'Plano Alimentar Completo', price: rand(350..550) * 100, duration: 90, modality: 'online' }
    base << { name: 'Retorno / Acompanhamento', price: rand(120..200) * 100, duration: 45, modality: 'online' }
  end
  base
end

def attach_photo(company, method_name, url)
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
  puts "    ⚠️  foto: #{e.message[0..60]}"
  false
end

# ── 2. Gerar 20 novos perfis ───────────────────────────────────────────────
puts "\n🥦 GERANDO 20 NUTRICIONISTAS COM FOTO\n#{'='*60}"

rng      = Random.new(99)
totals   = { created: 0, skipped: 0, errors: 0, photos: 0 }

# 12 mulheres + 8 homens = 20
genders = (['women'] * 12) + (['men'] * 8)

genders.each_with_index do |gender, idx|
  nb    = NEIGHBORHOODS[idx % NEIGHBORHOODS.size]
  sset  = SPECIALTIES_POOL[idx % SPECIALTIES_POOL.size]
  first = gender == 'women' ? FEMALE_FIRST[idx % FEMALE_FIRST.size] : MALE_FIRST[idx % MALE_FIRST.size]
  last  = LAST_NAMES[idx % LAST_NAMES.size]
  slug  = "#{first.downcase.gsub(/[^a-z]/,'')}.#{last.downcase.gsub(/[^a-z]/,'')}.add20#{idx}"
  email = "#{slug}@discover-demo.orbi"
  pts   = rng.rand(80..950)
  years = rng.rand(3..18)

  prefix = gender == 'women' ? ['Dra.', '', "#{first} #{last} Nutrição"][idx % 3] : ['Dr.', '', "#{first} #{last} Performance"][idx % 3]
  biz    = prefix.present? ? "#{prefix} #{first} #{last}".strip : "#{first} #{last} Nutrição"

  print "#{idx + 1}/20 #{biz[0..40]}..."

  if User.exists?(email: email)
    puts ' já existe'
    totals[:skipped] += 1
    next
  end

  begin
    ActiveRecord::Base.transaction do
      user = User.new(
        email: email, first_name: first, last_name: last,
        password: 'nutri123', password_confirmation: 'nutri123',
        confirmed_at: Time.current, accepted_terms_at: Time.current,
        accepted_privacy_at: Time.current, terms_of_service: '1',
        preferred_language: 'pt-BR'
      )
      user.skip_confirmation!
      user.save!

      account = user.reload.account
      company = account.company
      company.update!(screen_name: biz, cell_phone_number: gen_phone)

      company.addresses.create!(
        address_line1: "#{nb[:street]}, #{nb[:n]}", district: nb[:d],
        city: nb[:c], state: nb[:s], postcode: nb[:p], country: 'BR',
        latitude:  nb[:lat] + (rng.rand(-50..50) / 10_000.0),
        longitude: nb[:lng] + (rng.rand(-50..50) / 10_000.0)
      )

      account.update!(
        directory_visible: true, profession_category: 'Nutricionista',
        directory_description: gen_description(sset[:focus], nb[:d], years, pts),
        specialties: sset[:specs], professional_registration: gen_crn,
        subscription_status: 'active',
        preferences: { 'ratings_count' => rng.rand(18..220), 'ratings_average' => (rng.rand(44..50) / 10.0), 'patients_count' => pts }
      )

      gen_services(sset[:specs]).each do |svc|
        account.services.create!(
          name: svc[:name], selling_price_cents: svc[:price],
          currency: 'BRL', enabled: true,
          metadata: { duration_minutes: svc[:duration], modality: svc[:modality] }
        )
      end

      account.appointment_links.create!(
        name: "Agendar com #{biz}", token: SecureRandom.hex(16),
        active: true, settings: {}
      )

      # Foto logo — Pexels page 3
      pool = gender == 'women' ? PHOTO_WOMEN : PHOTO_MEN
      photo_id = pool[idx % pool.size]
      if attach_photo(company, :logo, pexels_url(photo_id))
        totals[:photos] += 1
        print " #{nb[:d]}, #{nb[:c]} 📸"
      else
        print " #{nb[:d]}, #{nb[:c]} ⚠️"
      end

      attach_photo(company, :cover_image, "https://picsum.photos/seed/add20_#{idx}/1200/400")

      puts
      totals[:created] += 1
    end
  rescue => e
    puts " ❌ #{e.message[0..80]}"
    totals[:errors] += 1
  end
end

puts "\n#{'='*60}"
puts "✅ Criados: #{totals[:created]}  |  ⏭ Pulados: #{totals[:skipped]}  |  ❌ Erros: #{totals[:errors]}"
puts "📸 Fotos OK: #{totals[:photos]}"
puts "#{'='*60}\n"
