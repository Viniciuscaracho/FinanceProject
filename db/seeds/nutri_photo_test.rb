# frozen_string_literal: true
#
# Teste de fontes de foto: apaga logos existentes e aplica 5 por fonte
# load 'db/seeds/nutri_photo_test.rb'

require 'open-uri'
require 'net/http'
require 'json'

# ── 5 IDs curados por gênero por fonte ────────────────────────────────────

UNSPLASH_TEST = [
  { id: 'photo-1551836022-d5d88e9218df', label: 'Unsplash-jaleco'     },
  { id: 'photo-1559839734-2b71ea197ec2', label: 'Unsplash-profissional'},
  { id: 'photo-1507003211169-0a1dd7228f2d', label: 'Unsplash-homem-1' },
  { id: 'photo-1494790108377-be9c29b29330', label: 'Unsplash-mulher-1' },
  { id: 'photo-1560250097-0b93528c311a', label: 'Unsplash-homem-2'    },
].freeze

PEXELS_TEST = [
  { id: 774909,  label: 'Pexels-mulher-1' },
  { id: 1239291, label: 'Pexels-mulher-2' },
  { id: 220453,  label: 'Pexels-homem-1'  },
  { id: 415829,  label: 'Pexels-mulher-3' },
  { id: 614810,  label: 'Pexels-homem-2'  },
].freeze

def unsplash_url(id)
  "https://images.unsplash.com/#{id}?w=400&h=400&fit=crop&crop=faces&auto=format&q=85"
end

def pexels_url(id)
  "https://images.pexels.com/photos/#{id}/pexels-photo-#{id}.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=400&w=400"
end

def generated_urls(count)
  api_key = ENV['GENERATED_PHOTOS_API_KEY']
  unless api_key.present?
    puts '⚠️  GENERATED_PHOTOS_API_KEY não definida — pulando Generated.photos'
    return []
  end
  uri = URI("https://api.generated.photos/api/v1/faces?api_key=#{api_key}&per_page=#{count}&pose=straight_on&emotion=smiling&age=25-45&order_by=random")
  resp = Net::HTTP.get_response(uri)
  data = JSON.parse(resp.body)
  faces = data['faces'] || []
  faces.map.with_index(1) { |f, i| { url: f.dig('urls', 'medium'), label: "Generated-#{i}" } }
rescue => e
  puts "⚠️  Generated.photos erro: #{e.message}"
  []
end

def reattach(company, url, label)
  io   = URI.open(url, 'rb', read_timeout: 20, open_timeout: 10)
  blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: "#{label}.jpg", content_type: 'image/jpeg')
  ActiveStorage::Attachment.where(
    record_type: company.class.polymorphic_name, record_id: company.id, name: 'logo'
  ).delete_all
  ActiveStorage::Attachment.create!(
    record_type: company.class.polymorphic_name, record_id: company.id,
    name: 'logo', blob_id: blob.id
  )
  true
rescue => e
  puts "    ❌ #{label}: #{e.message[0..80]}"
  false
end

# ── 1. Apaga todos os logos dos nutricionistas visíveis ───────────────────

accounts = Account
  .joins(:company)
  .where(directory_visible: true, suspended: false, discarded_at: nil)
  .where(profession_category: 'Nutricionista')
  .includes(company: [{ logo_attachment: :blob }])

puts "\n#{'='*60}"
puts "🗑  Apagando logos de #{accounts.size} perfis nutricionistas..."

accounts.each do |acc|
  company = acc.company
  if company&.logo&.attached?
    ActiveStorage::Attachment.where(
      record_type: company.class.polymorphic_name,
      record_id: company.id,
      name: 'logo'
    ).delete_all
    print '.'
  end
end
puts "\n✅ Logos apagados\n"

# ── 2. Pega os primeiros 15 perfis ────────────────────────────────────────
#    5 Unsplash | 5 Pexels | 5 Generated.photos

companies = accounts.reload.first(15).map(&:company).compact
puts "\nUsando #{companies.size} perfis para o teste\n"

# Busca URLs do Generated.photos antes de iterar (1 chamada de API)
gen_items = generated_urls(5)

groups = [
  UNSPLASH_TEST.map  { |e| { url: unsplash_url(e[:id]), label: e[:label] } },
  PEXELS_TEST.map    { |e| { url: pexels_url(e[:id]),   label: e[:label] } },
  gen_items.any? ? gen_items : [],
]
source_names = ['Unsplash', 'Pexels', 'Generated.photos']

puts "\n#{'='*60}"
groups.each_with_index do |group, gi|
  puts "\n📸 #{source_names[gi]} (#{group.size} fotos)"
  group.each_with_index do |item, i|
    comp = companies[gi * 5 + i]
    next unless comp
    url = item[:url] || item[:label]
    print "  #{i+1}. #{comp.screen_name&.truncate(30)}..."
    ok = reattach(comp, url, item[:label])
    puts ok ? " ✅ #{item[:label]}" : " ❌"
  end
end

puts "\n#{'='*60}"
puts '✅ Teste concluído — veja https://orbinutri.com.br/descobrir'
puts "#{'='*60}\n"
