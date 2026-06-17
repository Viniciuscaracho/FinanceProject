# frozen_string_literal: true
#
# Apaga TODOS os perfis demo (@discover-demo.orbi) via SQL direto
# Evita erros de FK usando information_schema para descobrir dependências
#
# load 'db/seeds/nutri_cleanup.rb'

conn = ActiveRecord::Base.connection

ids        = User.where("email LIKE ?", "%@discover-demo.orbi%").pluck(:id)
acc_ids    = Account.where(owner_id: ids).pluck(:id)
person_ids = Account.where(id: acc_ids).pluck(:company_id).compact

puts "\n#{'='*60}"
puts "🗑  #{ids.size} users | #{acc_ids.size} accounts | #{person_ids.size} people"
puts "#{'='*60}"

if ids.empty?
  puts "Nada para apagar."
else
  ids_s   = ids.join(',')
  acc_s   = acc_ids.join(',')
  ppl_s   = person_ids.join(',')

  # 1. Remove FK circular users→accounts
  conn.execute("UPDATE users SET account_id = NULL WHERE id IN (#{ids_s})")

  # 2. Apaga todas as tabelas com FK para accounts (via catálogo do Postgres)
  conn.execute(<<~SQL).each do |r|
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON rc.constraint_name = kcu.constraint_name
    JOIN information_schema.table_constraints tc
      ON rc.unique_constraint_name = tc.constraint_name
    WHERE tc.table_name = 'accounts'
  SQL
    next if %w[users accounts people].include?(r['table_name'])
    begin
      n = conn.execute("DELETE FROM \"#{r['table_name']}\" WHERE \"#{r['column_name']}\" IN (#{acc_s})").cmd_tuples
      puts "  #{r['table_name']}: #{n}" if n > 0
    rescue => e
      puts "  #{r['table_name']}: skip (#{e.message[0..50]})"
    end
  end

  # 3. Attachments e endereços das companies (Person)
  if person_ids.any?
    n = conn.execute("DELETE FROM active_storage_attachments WHERE record_type = 'Person' AND record_id IN (#{ppl_s})").cmd_tuples
    puts "  active_storage_attachments (Person): #{n}" if n > 0
    n = conn.execute("DELETE FROM addresses WHERE addressable_type = 'Person' AND addressable_id IN (#{ppl_s})").cmd_tuples
    puts "  addresses: #{n}" if n > 0
  end

  # 4. Deleta na ordem correta
  conn.execute("DELETE FROM accounts WHERE id IN (#{acc_s})")
  conn.execute("DELETE FROM people WHERE id IN (#{ppl_s})") if person_ids.any?
  conn.execute("DELETE FROM users WHERE id IN (#{ids_s})")

  puts "\n✅ Limpo. #{ids.size} usuários demo removidos."
end

puts "#{'='*60}\n"
