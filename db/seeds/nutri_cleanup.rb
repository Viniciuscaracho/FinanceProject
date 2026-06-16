# frozen_string_literal: true
#
# Apaga TODOS os perfis demo de nutricionistas (@discover-demo.orbi)
# e suas associações (account, company, address, services, blobs S3)
#
# load 'db/seeds/nutri_cleanup.rb'

users = User.where("email LIKE ?", "%@discover-demo.orbi%")
total = users.count
puts "\n#{'='*60}"
puts "🗑  #{total} usuários demo encontrados — iniciando limpeza..."
puts "#{'='*60}"

# Coleta IDs antes de destruir
company_ids = []
blob_ids    = []

users.find_each do |u|
  company = u.account&.company
  next unless company
  company_ids << company.id

  # Blobs dos attachments (logo + cover_image) para deletar do S3
  ActiveStorage::Attachment.where(
    record_type: company.class.polymorphic_name,
    record_id:   company.id
  ).each { |att| blob_ids << att.blob_id }
end

puts "  → #{company_ids.size} companies (Person) encontradas"
puts "  → #{blob_ids.size} blobs de mídia para apagar"

# 1. Apaga attachments (metadados do banco)
if company_ids.any?
  deleted_att = ActiveStorage::Attachment.where(
    record_type: 'Person', record_id: company_ids
  ).delete_all
  puts "  ✅ #{deleted_att} attachments removidos"
end

# 2. Apaga blobs (S3 + banco) — purge_later para não travar
if blob_ids.any?
  blobs = ActiveStorage::Blob.where(id: blob_ids.uniq)
  blobs.each(&:purge_later)
  puts "  ✅ #{blobs.size} blobs agendados para purge (S3)"
end

# 3. Destrói usuários em cascata (account → company → addresses → services etc.)
destroyed = 0
errors    = 0
users.find_each do |u|
  u.destroy!
  destroyed += 1
  print '.' if (destroyed % 10).zero?
rescue => e
  errors += 1
  puts "\n  ⚠️  #{u.email}: #{e.message[0..60]}"
end

puts "\n\n#{'='*60}"
puts "✅ Destruídos: #{destroyed}  |  ❌ Erros: #{errors}"
puts "Banco limpo — pronto para recriar os perfis."
puts "#{'='*60}\n"
