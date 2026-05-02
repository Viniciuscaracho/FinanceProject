# frozen_string_literal: true
# Popula um account com dados realistas de barbearia para análise do dashboard.
# Uso: bundle exec rails runner db/seeds/populate_dashboard.rb [account_id]
# Sem argumento: usa o account 1 (admin@exemplo.com)

TARGET_ACCOUNT_ID = (ARGV[0] || ENV['ACCOUNT_ID'] || 1).to_i

account = Account.find_by(id: TARGET_ACCOUNT_ID)
unless account
  puts "❌ Account #{TARGET_ACCOUNT_ID} não encontrado."
  exit 1
end

puts "\n📋 Populando Account ##{account.id} — #{account.company&.first_name || 'Sem nome'}"
puts "=" * 60

# ── 1. CONTA BANCÁRIA ──────────────────────────────────────────
puts "\n💳 Conta bancária..."
bank = account.bank_accounts.first
unless bank
  bank = account.bank_accounts.create!(
    name: "Conta Principal",
    account_type_cd: 0
  )
  puts "   ✅ Criada: #{bank.name}"
else
  puts "   ✓ Já existe: #{bank.name}"
end

# ── 2. CATEGORIAS ──────────────────────────────────────────────
puts "\n🏷️  Categorias..."

CATEGORIAS = [
  { name: "Cortes de Cabelo",    transaction_type_cd: 0 },
  { name: "Barba e Bigode",      transaction_type_cd: 0 },
  { name: "Tratamentos",         transaction_type_cd: 0 },
  { name: "Produtos Vendidos",   transaction_type_cd: 0 },
  { name: "Outros Serviços",     transaction_type_cd: 0 },
  { name: "Aluguel",             transaction_type_cd: 1 },
  { name: "Salários",            transaction_type_cd: 3 },
  { name: "Insumos e Produtos",  transaction_type_cd: 2 },
  { name: "Marketing",           transaction_type_cd: 2 },
  { name: "Utilidades",          transaction_type_cd: 1 },
].freeze

cats = {}
CATEGORIAS.each do |c|
  cat = account.categories.find_or_create_by!(name: c[:name]) do |nc|
    nc.transaction_type_cd = c[:transaction_type_cd]
  end
  cats[c[:name]] = cat
  puts "   ✓ #{cat.name}"
end

# ── 3. CONTATOS (clientes) ────────────────────────────────────
puts "\n👥 Contatos..."

CLIENTES = [
  { first_name: "Rafael",   last_name: "Mendes",    phone: "11991110001" },
  { first_name: "Bruno",    last_name: "Alves",     phone: "11991110002" },
  { first_name: "Lucas",    last_name: "Ferreira",  phone: "11991110003" },
  { first_name: "Gustavo",  last_name: "Lima",      phone: "11991110004" },
  { first_name: "Thiago",   last_name: "Ribeiro",   phone: "11991110005" },
  { first_name: "Felipe",   last_name: "Costa",     phone: "11991110006" },
  { first_name: "André",    last_name: "Souza",     phone: "11991110007" },
  { first_name: "Diego",    last_name: "Martins",   phone: "11991110008" },
  { first_name: "Eduardo",  last_name: "Nunes",     phone: "11991110009" },
  { first_name: "Matheus",  last_name: "Carvalho",  phone: "11991110010" },
].freeze

contacts = {}
CLIENTES.each do |c|
  contact = account.contacts.find_or_create_by!(first_name: c[:first_name], last_name: c[:last_name]) do |nc|
    nc.phone_number = c[:phone]
    nc.contact_type_cd = 0
    nc.person_type_cd = 0
  end
  contacts[c[:first_name]] = contact
end
puts "   ✓ #{account.contacts.count} contatos no total"

# ── 4. TRANSAÇÕES ─────────────────────────────────────────────
puts "\n💰 Transações dos últimos 6 meses..."

today = Date.current
existing = account.transactions.where('created_at > ?', 6.months.ago).count
puts "   Existentes nos últimos 6 meses: #{existing}"

def create_tx(account, bank, attrs)
  account.transactions.create!(
    bank_account: bank,
    kind_cd: 0,          # simple
    paid: attrs.fetch(:paid, true),
    paid_at: attrs[:paid] ? (attrs[:due_date].to_time + 8.hours) : nil,
    due_date: attrs[:due_date],
    name: attrs[:name],
    description: attrs[:description] || attrs[:name],
    amount_cents: attrs[:amount_cents],
    amount_currency: "BRL",
    transaction_type_cd: attrs[:transaction_type_cd],
    category: attrs[:category],
    contact: attrs[:contact],
    payment_method_cd: attrs.fetch(:payment_method_cd, 0)
  )
rescue ActiveRecord::RecordInvalid => e
  puts "   ⚠️  #{attrs[:name]}: #{e.message}"
  nil
end

# ── RECEITAS: serviços por semana nos últimos 6 meses ──
clientes = account.contacts.limit(10).to_a
receita_cats = [cats["Cortes de Cabelo"], cats["Barba e Bigode"], cats["Tratamentos"], cats["Produtos Vendidos"]]

servicos = [
  { name: "Corte de Cabelo",      amount: 4500,  cat: "Cortes de Cabelo",   type: 0 },
  { name: "Corte + Barba",        amount: 7000,  cat: "Cortes de Cabelo",   type: 0 },
  { name: "Barba",                amount: 3500,  cat: "Barba e Bigode",     type: 0 },
  { name: "Hidratação Capilar",   amount: 8000,  cat: "Tratamentos",        type: 0 },
  { name: "Corte Infantil",       amount: 3000,  cat: "Cortes de Cabelo",   type: 0 },
  { name: "Luzes / Coloração",    amount: 15000, cat: "Tratamentos",        type: 0 },
  { name: "Pomada Modeladora",    amount: 3500,  cat: "Produtos Vendidos",  type: 0 },
  { name: "Shampoo Premium",      amount: 4000,  cat: "Produtos Vendidos",  type: 0 },
]

receitas_criadas = 0
# Gerar ~4-8 receitas por semana das últimas 26 semanas
26.times do |week|
  week_start = today - (week + 1).weeks
  num_servicos = rand(4..8)
  num_servicos.times do
    dia = week_start + rand(0..6).days
    next if dia > today
    servico = servicos.sample
    cliente  = clientes.sample
    tx = create_tx(account, bank, {
      name: servico[:name],
      amount_cents: servico[:amount] + rand(-500..1000),
      transaction_type_cd: servico[:type],
      category: cats[servico[:cat]],
      contact: cliente,
      due_date: dia,
      paid: dia < today - 2.days ? true : [true, false].sample,
      payment_method_cd: [0, 1, 2, 3].sample  # dinheiro, cartão déb, cartão créd, pix
    })
    receitas_criadas += 1 if tx
  end
end
puts "   ✅ #{receitas_criadas} receitas de serviços criadas"

# ── DESPESAS FIXAS: aluguel + utilidades mensais ──
despesas_fixas = 0
6.times do |m|
  mes = today - m.months
  [
    { name: "Aluguel",         amount: 250000, cat: "Aluguel",    type: 1 },
    { name: "Energia Elétrica",amount: 35000,  cat: "Utilidades", type: 1 },
    { name: "Internet",        amount: 12000,  cat: "Utilidades", type: 1 },
    { name: "Água",            amount: 8000,   cat: "Utilidades", type: 1 },
  ].each do |d|
    due = Date.new(mes.year, mes.month, 5)
    next if due > today
    tx = create_tx(account, bank, {
      name: d[:name],
      amount_cents: d[:amount],
      transaction_type_cd: d[:type],
      category: cats[d[:cat]],
      due_date: due,
      paid: due < today - 5.days
    })
    despesas_fixas += 1 if tx
  end
end
puts "   ✅ #{despesas_fixas} despesas fixas criadas"

# ── DESPESAS VARIÁVEIS: insumos e marketing ──
despesas_var = 0
6.times do |m|
  mes = today - m.months
  [
    { name: "Compra de Produtos (insumos)", amount: rand(80000..150000), cat: "Insumos e Produtos", type: 2, dia: 10 },
    { name: "Instagram Ads",                amount: rand(20000..50000),  cat: "Marketing",          type: 2, dia: 15 },
    { name: "Material de Limpeza",          amount: rand(5000..15000),   cat: "Insumos e Produtos", type: 2, dia: 20 },
  ].each do |d|
    due = Date.new(mes.year, mes.month, d[:dia])
    next if due > today
    tx = create_tx(account, bank, {
      name: d[:name],
      amount_cents: d[:amount],
      transaction_type_cd: d[:type],
      category: cats[d[:cat]],
      due_date: due,
      paid: due < today - 5.days
    })
    despesas_var += 1 if tx
  end
end
puts "   ✅ #{despesas_var} despesas variáveis criadas"

# ── FOLHA: salários mensais ──
salarios = 0
6.times do |m|
  mes = today - m.months
  [
    { name: "Salário — Carlos (barbeiro)",   amount: 350000 },
    { name: "Salário — Ana (recepcionista)", amount: 250000 },
  ].each do |s|
    due = Date.new(mes.year, mes.month, [Date.new(mes.year, mes.month, -1).day, 30].min)
    next if due > today
    tx = create_tx(account, bank, {
      name: s[:name],
      amount_cents: s[:amount],
      transaction_type_cd: 3,  # payroll
      category: cats["Salários"],
      due_date: due,
      paid: due < today - 3.days
    })
    salarios += 1 if tx
  end
end
puts "   ✅ #{salarios} registros de folha criados"

# ── PENDÊNCIAS: a vencer nos próximos dias ──
puts "\n📌 Compromissos pendentes..."

[
  { name: "Aluguel — próximo mês",        amount: 250000, cat: "Aluguel",            type: 1, due: today + 5.days },
  { name: "Fatura Cartão POS",            amount: 18000,  cat: "Utilidades",         type: 1, due: today + 3.days },
  { name: "Reposição de Produtos",        amount: 95000,  cat: "Insumos e Produtos", type: 2, due: today + 7.days },
  { name: "Instagram Ads — próximo mês",  amount: 30000,  cat: "Marketing",          type: 2, due: today + 10.days },
].each do |p|
  create_tx(account, bank, {
    name: p[:name],
    amount_cents: p[:amount],
    transaction_type_cd: p[:type],
    category: cats[p[:cat]],
    due_date: p[:due],
    paid: false
  })
end
puts "   ✅ Compromissos a vencer criados"

# ── ATRASADOS: vencidos não pagos ──
puts "\n⚠️  Compromissos atrasados..."

[
  { name: "Fornecedor — Loja A (atrasado)",  amount: 45000, cat: "Insumos e Produtos", type: 2, due: today - 5.days },
  { name: "Manutenção Cadeiras",             amount: 28000, cat: "Utilidades",         type: 2, due: today - 8.days },
  { name: "Boleto Seguro Estabelecimento",   amount: 22000, cat: "Utilidades",         type: 1, due: today - 12.days },
].each do |a|
  create_tx(account, bank, {
    name: a[:name],
    amount_cents: a[:amount],
    transaction_type_cd: a[:type],
    category: cats[a[:cat]],
    due_date: a[:due],
    paid: false
  })
end
puts "   ✅ Compromissos atrasados criados"

# ── HOJE: vencendo hoje ──
[
  { name: "Receita Dia — Clientes",    amount: rand(15000..30000), cat: "Cortes de Cabelo", type: 0, contact: clientes.sample },
  { name: "Fatura Internet — vence hoje", amount: -12000,          cat: "Utilidades",       type: 1 },
].each do |h|
  create_tx(account, bank, {
    name: h[:name],
    amount_cents: h[:amount],
    transaction_type_cd: h[:type],
    category: cats[h[:cat]],
    contact: h[:contact],
    due_date: today,
    paid: false
  })
end
puts "   ✅ Compromissos de hoje criados"

# ── RESUMO FINAL ──────────────────────────────────────────────
total = account.transactions.count
income = account.transactions.revenues.sum(:amount_cents) / 100.0
expenses = account.transactions.expenses.sum(:amount_cents) / 100.0
overdue = account.transactions.only_unpaid.where('due_date < ?', today).count
today_count = account.transactions.only_unpaid.where(due_date: today).count

puts "\n" + "=" * 60
puts "✅ CONCLUÍDO — Account ##{account.id} (#{account.company&.first_name})"
puts "   Transações:   #{total}"
puts "   Categorias:   #{account.categories.count}"
puts "   Contatos:     #{account.contacts.count}"
puts "   Receitas:     R$ #{'%.2f' % income}"
puts "   Despesas:     R$ #{'%.2f' % expenses}"
puts "   Saldo:        R$ #{'%.2f' % (income - expenses)}"
puts "   Atrasados:    #{overdue}"
puts "   Hoje:         #{today_count}"
puts "=" * 60
