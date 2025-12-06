# frozen_string_literal: true

# Seed para criar dados de teste financeiros
puts "\n=== Criando dados de teste financeiros ==="

account = Account.first
unless account
  puts "❌ Erro: Nenhuma conta encontrada. Execute primeiro: bin/rails db:seed"
  exit
end

# Criar categorias básicas se não existirem
puts "\n📁 Criando categorias..."

categories_data = [
  { name: 'Serviços de Corte', transaction_type: :revenue },
  { name: 'Serviços de Barba', transaction_type: :revenue },
  { name: 'Produtos Vendidos', transaction_type: :revenue },
  { name: 'Aluguel', transaction_type: :fixed_expense },
  { name: 'Energia Elétrica', transaction_type: :fixed_expense },
  { name: 'Água', transaction_type: :fixed_expense },
  { name: 'Internet', transaction_type: :fixed_expense },
  { name: 'Produtos de Limpeza', transaction_type: :variable_expense },
  { name: 'Produtos para Barbearia', transaction_type: :variable_expense },
  { name: 'Marketing', transaction_type: :variable_expense },
  { name: 'Salários', transaction_type: :payroll },
  { name: 'Impostos', transaction_type: :tax }
]

categories = {}
categories_data.each do |cat_data|
  category = Category.find_or_create_by!(account: account, name: cat_data[:name]) do |c|
    c.transaction_type_cd = Transaction.transaction_types[cat_data[:transaction_type]]
  end
  categories[cat_data[:name]] = category
  puts "  ✓ Categoria: #{category.name}"
end

# Criar conta bancária padrão se não existir
bank_account = account.bank_accounts.first || account.bank_accounts.create!(
  name: 'Conta Principal',
  initial_balance_cents: 100000, # R$ 1.000,00
  currency: 'BRL'
)
puts "\n💰 Conta bancária: #{bank_account.name}"

# Criar transações de teste
puts "\n💳 Criando transações de teste..."

# Receitas dos últimos 3 meses
puts "\n  📈 Receitas:"
3.times do |month_offset|
  month_start = Date.today.beginning_of_month - month_offset.months
  
  # Receitas de serviços
  [15, 20, 25, 18, 22].each_with_index do |day, idx|
    date = month_start + day.days
    next if date > Date.today
    
    begin
      Transaction.create!(
        account: account,
        bank_account: bank_account,
        category: categories['Serviços de Corte'],
        name: "Corte de Cabelo - Cliente #{idx + 1}",
        transaction_type_cd: Transaction.transaction_types[:revenue],
        amount_cents: (3000 + rand(2000)), # R$ 30,00 - R$ 50,00
        amount_currency: 'BRL',
        exchanged_amount_cents: (3000 + rand(2000)),
        exchanged_amount_currency: 'BRL',
        due_date: date,
        paid: true,
        paid_at: date,
        paid_amount_cents: (3000 + rand(2000)),
        paid_amount_currency: 'BRL',
      payment_method_cd: Transaction::PAYMENT_METHOD[:pix],
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
      )
    rescue => e
      puts "  ⚠️ Erro ao criar transação: #{e.message}"
    end
  end
  
  [10, 12, 15, 8, 14].each_with_index do |day, idx|
    date = month_start + day.days
    next if date > Date.today
    
    Transaction.create!(
      account: account,
      bank_account: bank_account,
      category: categories['Serviços de Barba'],
      name: "Barba - Cliente #{idx + 1}",
      transaction_type_cd: Transaction.transaction_types[:revenue],
      amount_cents: (2000 + rand(1000)), # R$ 20,00 - R$ 30,00
      amount_currency: 'BRL',
      exchanged_amount_cents: (2000 + rand(1000)),
      exchanged_amount_currency: 'BRL',
      due_date: date,
      paid: true,
      paid_at: date,
      paid_amount_cents: (2000 + rand(1000)),
      paid_amount_currency: 'BRL',
      payment_method_cd: Transaction::PAYMENT_METHOD[:credit_card],
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
    )
  end
end

puts "  ✓ #{Transaction.revenues.count} receitas criadas"

# Despesas fixas
puts "\n  📉 Despesas Fixas:"
3.times do |month_offset|
  month_start = Date.today.beginning_of_month - month_offset.months
  
  Transaction.create!(
    account: account,
    bank_account: bank_account,
    category: categories['Aluguel'],
    name: 'Aluguel do Salão',
    transaction_type_cd: Transaction.transaction_types[:fixed_expense],
    amount_cents: 500000, # R$ 5.000,00
    amount_currency: 'BRL',
    exchanged_amount_cents: 500000,
    exchanged_amount_currency: 'BRL',
    due_date: month_start + 5.days,
    paid: true,
    paid_at: month_start + 5.days,
    paid_amount_cents: 500000,
    paid_amount_currency: 'BRL',
    payment_method_cd: Transaction::PAYMENT_METHOD[:bank_transfer],
    payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
  )
  
  Transaction.create!(
    account: account,
    bank_account: bank_account,
    category: categories['Energia Elétrica'],
    name: 'Conta de Luz',
    transaction_type_cd: Transaction.transaction_types[:fixed_expense],
    amount_cents: (80000 + rand(20000)), # R$ 800,00 - R$ 1.000,00
    amount_currency: 'BRL',
    exchanged_amount_cents: (80000 + rand(20000)),
    exchanged_amount_currency: 'BRL',
    due_date: month_start + 10.days,
    paid: true,
    paid_at: month_start + 10.days,
    paid_amount_cents: (80000 + rand(20000)),
    paid_amount_currency: 'BRL',
    payment_method_cd: Transaction::PAYMENT_METHOD[:bank_transfer],
    payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
  )
  
  Transaction.create!(
    account: account,
    bank_account: bank_account,
    category: categories['Água'],
    name: 'Conta de Água',
    transaction_type_cd: Transaction.transaction_types[:fixed_expense],
    amount_cents: (50000 + rand(10000)), # R$ 500,00 - R$ 600,00
    amount_currency: 'BRL',
    exchanged_amount_cents: (50000 + rand(10000)),
    exchanged_amount_currency: 'BRL',
    due_date: month_start + 12.days,
    paid: true,
    paid_at: month_start + 12.days,
    paid_amount_cents: (50000 + rand(10000)),
    paid_amount_currency: 'BRL',
    payment_method_cd: Transaction::PAYMENT_METHOD[:bank_transfer],
    payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
  )
  
  Transaction.create!(
    account: account,
    bank_account: bank_account,
    category: categories['Internet'],
    name: 'Internet',
    transaction_type_cd: Transaction.transaction_types[:fixed_expense],
    amount_cents: 15000, # R$ 150,00
    amount_currency: 'BRL',
    exchanged_amount_cents: 15000,
    exchanged_amount_currency: 'BRL',
    due_date: month_start + 8.days,
    paid: true,
    paid_at: month_start + 8.days,
    paid_amount_cents: 15000,
    paid_amount_currency: 'BRL',
    payment_method_cd: Transaction::PAYMENT_METHOD[:bank_transfer],
    payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
  )
end

puts "  ✓ #{Transaction.where(transaction_type_cd: Transaction.transaction_types[:fixed_expense]).count} despesas fixas criadas"

# Despesas variáveis
puts "\n  📉 Despesas Variáveis:"
3.times do |month_offset|
  month_start = Date.today.beginning_of_month - month_offset.months
  
  [5, 12, 20].each do |day|
    date = month_start + day.days
    next if date > Date.today
    
    Transaction.create!(
      account: account,
      bank_account: bank_account,
      category: categories['Produtos para Barbearia'],
      name: 'Compra de Produtos',
      transaction_type_cd: Transaction.transaction_types[:variable_expense],
      amount_cents: (30000 + rand(20000)), # R$ 300,00 - R$ 500,00
      amount_currency: 'BRL',
      exchanged_amount_cents: (30000 + rand(20000)),
      exchanged_amount_currency: 'BRL',
      due_date: date,
      paid: true,
      paid_at: date,
      paid_amount_cents: (30000 + rand(20000)),
      paid_amount_currency: 'BRL',
      payment_method_cd: Transaction::PAYMENT_METHOD[:credit_card],
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
    )
  end
  
  [8, 18].each do |day|
    date = month_start + day.days
    next if date > Date.today
    
    Transaction.create!(
      account: account,
      bank_account: bank_account,
      category: categories['Marketing'],
      name: 'Anúncios e Marketing',
      transaction_type_cd: Transaction.transaction_types[:variable_expense],
      amount_cents: (50000 + rand(30000)), # R$ 500,00 - R$ 800,00
      amount_currency: 'BRL',
      exchanged_amount_cents: (50000 + rand(30000)),
      exchanged_amount_currency: 'BRL',
      due_date: date,
      paid: true,
      paid_at: date,
      paid_amount_cents: (50000 + rand(30000)),
      paid_amount_currency: 'BRL',
      payment_method_cd: Transaction::PAYMENT_METHOD[:credit_card],
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
    )
  end
end

puts "  ✓ #{Transaction.where(transaction_type_cd: Transaction.transaction_types[:variable_expense]).count} despesas variáveis criadas"

# Folha de pagamento
puts "\n  💼 Folha de Pagamento:"
3.times do |month_offset|
  month_start = Date.today.beginning_of_month - month_offset.months
  
  Transaction.create!(
    account: account,
    bank_account: bank_account,
    category: categories['Salários'],
    name: 'Salário dos Funcionários',
    transaction_type_cd: Transaction.transaction_types[:payroll],
    amount_cents: 800000, # R$ 8.000,00
    amount_currency: 'BRL',
    exchanged_amount_cents: 800000,
    exchanged_amount_currency: 'BRL',
    due_date: month_start + 5.days,
    paid: true,
    paid_at: month_start + 5.days,
    paid_amount_cents: 800000,
    paid_amount_currency: 'BRL',
    payment_method_cd: Transaction::PAYMENT_METHOD[:bank_transfer],
    payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
  )
end

puts "  ✓ #{Transaction.where(transaction_type_cd: Transaction.transaction_types[:payroll]).count} folhas de pagamento criadas"

# Impostos
puts "\n  🏛️ Impostos:"
3.times do |month_offset|
  month_start = Date.today.beginning_of_month - month_offset.months
  
  Transaction.create!(
    account: account,
    bank_account: bank_account,
    category: categories['Impostos'],
    name: 'Impostos Mensais',
    transaction_type_cd: Transaction.transaction_types[:tax],
    amount_cents: (100000 + rand(50000)), # R$ 1.000,00 - R$ 1.500,00
    amount_currency: 'BRL',
    exchanged_amount_cents: (100000 + rand(50000)),
    exchanged_amount_currency: 'BRL',
    due_date: month_start + 20.days,
    paid: true,
    paid_at: month_start + 20.days,
    paid_amount_cents: (100000 + rand(50000)),
    paid_amount_currency: 'BRL',
    payment_method_cd: Transaction::PAYMENT_METHOD[:bank_transfer],
    payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash]
  )
end

puts "  ✓ #{Transaction.where(transaction_type_cd: Transaction.transaction_types[:tax]).count} impostos criados"

puts "\n✅ Dados de teste criados com sucesso!"
puts "   Total de transações: #{Transaction.count}"
puts "   Receitas: #{Transaction.revenues.count}"
puts "   Despesas: #{Transaction.expenses.count}"

