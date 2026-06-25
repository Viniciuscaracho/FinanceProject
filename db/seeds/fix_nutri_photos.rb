# frozen_string_literal: true
#
# Diagnóstico e re-upload de fotos para nutricionistas demo
# Execute: bundle exec rails runner db/seeds/fix_nutri_photos.rb

require 'open-uri'
require 'net/http'

DEMO_DOMAIN = 'discover-demo.orbi'

# Mapeamento: email -> foto
PHOTO_MAP = {
  'fernanda.costa.nutri'   => { gender: 'women', index: 1,  cover: 1  },
  'juliana.rocha.nutri'    => { gender: 'women', index: 2,  cover: 2  },
  'rodrigo.andrade.nutri'  => { gender: 'men',   index: 1,  cover: 3  },
  'camila.ferreira.nutri'  => { gender: 'women', index: 3,  cover: 4  },
  'beatriz.martins.nutri'  => { gender: 'women', index: 4,  cover: 5  },
  'lucas.oliveira.nutri'   => { gender: 'men',   index: 2,  cover: 6  },
  'patricia.lima.nutri'    => { gender: 'women', index: 5,  cover: 7  },
  'thais.barbosa.nutri'    => { gender: 'women', index: 6,  cover: 8  },
  'anaclara.pereira.nutri' => { gender: 'women', index: 7,  cover: 9  },
  'felipe.souza.nutri'     => { gender: 'men',   index: 3,  cover: 10 },
}

def s3_file_exists?(url)
  uri = URI.parse(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == 'https'
  http.open_timeout = 5
  http.read_timeout = 5
  response = http.head(uri.request_uri)
  response.code.to_i == 200
rescue => e
  puts "    [check] #{e.message}"
  false
end

def download_image(url)
  URI.open(url, 'rb', read_timeout: 15, open_timeout: 10)
rescue => e
  puts "    ❌ Download falhou: #{e.message}"
  nil
end

def attach_and_verify(company, method_name, io, filename)
  attachment = company.public_send(method_name)
  # Remove blob órfão se existir
  attachment.purge if attachment.attached?
  attachment.attach(io: io, filename: filename, content_type: 'image/jpeg')

  return false unless attachment.attached?

  # Verifica se o arquivo realmente está no S3
  begin
    signed_url = attachment.url(expires_in: 60.seconds)
    redirect = Net::HTTP.get_response(URI.parse(signed_url))
    final_url = redirect['location'] || signed_url
    s3_file_exists?(final_url)
  rescue => e
    puts "    [verify] #{e.message}"
    false
  end
rescue => e
  puts "    ❌ Attach falhou: #{e.message}"
  false
end

puts "\n#{'='*70}"
puts '📸 DIAGNÓSTICO E REPARO DE FOTOS — NUTRICIONISTAS DEMO'
puts "#{'='*70}\n"

# 1. Verifica conectividade
print "🌐 Testando acesso a randomuser.me... "
test_io = download_image("https://randomuser.me/api/portraits/women/1.jpg")
if test_io
  puts "✅ OK (#{test_io.size} bytes)"
else
  puts "❌ Sem acesso — abortando."
  exit 1
end

print "🌐 Testando acesso a picsum.photos... "
test_cover = download_image("https://picsum.photos/seed/nutri1/1200/400")
puts test_cover ? "✅ OK" : "❌ falhou (fotos de capa podem não funcionar)"

puts "\n--- Verificando e reparando fotos ---\n"

fixed = 0; skipped = 0; failed = 0

PHOTO_MAP.each do |local_part, cfg|
  email = "#{local_part}@#{DEMO_DOMAIN}"
  user = User.find_by(email: email)
  unless user
    puts "⚠️  #{email} não encontrado, pulando."
    skipped += 1
    next
  end

  company = user.account&.company
  unless company
    puts "⚠️  #{email} sem company, pulando."
    skipped += 1
    next
  end

  name = company.screen_name
  print "👤 #{name}..."

  logo_url  = "https://randomuser.me/api/portraits/#{cfg[:gender]}/#{cfg[:index]}.jpg"
  cover_url = "https://picsum.photos/seed/nutri#{cfg[:cover]}/1200/400"

  logo_ok  = false
  cover_ok = false

  # Logo
  logo_io = download_image(logo_url)
  if logo_io
    logo_ok = attach_and_verify(company, :logo, logo_io, "logo_#{cfg[:gender]}_#{cfg[:index]}.jpg")
  end

  # Capa
  cover_io = download_image(cover_url)
  if cover_io
    cover_ok = attach_and_verify(company, :cover_image, cover_io, "cover_nutri#{cfg[:cover]}.jpg")
  end

  if logo_ok && cover_ok
    puts " ✅ logo + capa OK"
    fixed += 1
  elsif logo_ok
    puts " ⚠️  logo OK, capa falhou"
    fixed += 1
  elsif cover_ok
    puts " ⚠️  capa OK, logo falhou"
    failed += 1
  else
    puts " ❌ ambos falharam"
    failed += 1
  end
end

puts "\n#{'='*70}"
puts "✅ Reparados: #{fixed}  |  ⏭ Pulados: #{skipped}  |  ❌ Falhas: #{failed}"
puts "#{'='*70}\n"
