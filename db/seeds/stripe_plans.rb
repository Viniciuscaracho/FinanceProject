# frozen_string_literal: true
# Cria os planos do Orbi no Stripe se ainda não existirem.
# Idempotente: verifica pelo metadata source=orbi antes de criar.
# Requer STRIPE_API_KEY configurado no ambiente.

return puts '⚠️  Stripe não configurado — pulando seed de planos' unless BarberManagement::Stripe::Client.configured?

ORBI_PLANS = [
  { unit_amount: 1990,  interval: 'month', interval_count: 1, nickname: 'Mensal',    label: 'mensal' },
  { unit_amount: 9990,  interval: 'month', interval_count: 6, nickname: 'Semestral', label: 'semestral' },
  { unit_amount: 17990, interval: 'year',  interval_count: 1, nickname: 'Anual',     label: 'anual' }
].freeze

BarberManagement::Stripe::Client.with_api_key do
  # Verifica se o produto já existe
  existing = Stripe::Product.list(active: true, limit: 100).data.find do |p|
    p.metadata['source'] == 'orbi' || p.metadata['source'] == 'barber_management'
  end

  if existing
    puts "✅ Produto Orbi já existe no Stripe (#{existing.id}) — pulando criação"
    next
  end

  product = Stripe::Product.create(
    name:        'Orbi',
    description: 'Plataforma de gestão para profissionais de saúde e beleza',
    metadata:    { source: 'orbi', project: 'Orbi' }
  )
  puts "✅ Produto criado: #{product.id}"

  ORBI_PLANS.each do |plan|
    price = Stripe::Price.create(
      product:     product.id,
      currency:    'brl',
      unit_amount: plan[:unit_amount],
      recurring:   { interval: plan[:interval], interval_count: plan[:interval_count] },
      nickname:    plan[:nickname],
      metadata:    { source: 'orbi', interval_label: plan[:label] }
    )
    puts "  #{plan[:nickname]}: #{price.id} (R$ #{format('%.2f', plan[:unit_amount] / 100.0)})"
  end

  puts '✅ Planos Orbi criados no Stripe com sucesso!'
end
