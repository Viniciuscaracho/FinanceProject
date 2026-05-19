# frozen_string_literal: true
# Seed de planos alimentares para testes de performance e usabilidade
# Execute com: rails runner db/seeds/meal_plans_data.rb

puts "\n" + "=" * 80
puts "🥗 CRIANDO DADOS DE PLANOS ALIMENTARES"
puts "=" * 80

account = Account.first
unless account
  puts "❌ ERRO: Nenhuma conta encontrada. Execute db:seed primeiro!"
  exit
end

puts "\n📋 Conta: #{account.id}"

# ── 1. ALIMENTOS (TACO global) ────────────────────────────────────────────────

FOODS_CATALOG = [
  { name: 'Arroz branco cozido',              kcal: 128, protein: 2.5,  carbs: 28.1, fat: 0.2, fiber: 1.6 },
  { name: 'Arroz integral cozido',            kcal: 124, protein: 2.6,  carbs: 25.8, fat: 1.0, fiber: 2.7 },
  { name: 'Aveia em flocos',                  kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1 },
  { name: 'Pão francês',                      kcal: 300, protein: 8.0,  carbs: 58.6, fat: 3.1, fiber: 2.3 },
  { name: 'Pão de forma integral',            kcal: 253, protein: 8.2,  carbs: 43.9, fat: 4.8, fiber: 5.9 },
  { name: 'Macarrão cozido',                  kcal: 113, protein: 3.7,  carbs: 22.7, fat: 0.5, fiber: 1.3 },
  { name: 'Batata doce cozida',               kcal: 77,  protein: 1.4,  carbs: 17.6, fat: 0.1, fiber: 2.5 },
  { name: 'Tapioca (goma hidratada)',         kcal: 62,  protein: 0.1,  carbs: 15.3, fat: 0.0, fiber: 0.1 },
  { name: 'Feijão carioca cozido',            kcal: 76,  protein: 4.8,  carbs: 13.6, fat: 0.5, fiber: 8.5 },
  { name: 'Feijão preto cozido',              kcal: 77,  protein: 4.5,  carbs: 14.0, fat: 0.5, fiber: 8.4 },
  { name: 'Lentilha cozida',                  kcal: 93,  protein: 6.3,  carbs: 15.6, fat: 0.5, fiber: 3.7 },
  { name: 'Grão-de-bico cozido',              kcal: 164, protein: 8.9,  carbs: 27.4, fat: 2.6, fiber: 6.4 },
  { name: 'Frango grelhado (peito sem pele)', kcal: 163, protein: 32.0, carbs: 0.0,  fat: 3.2, fiber: 0.0 },
  { name: 'Carne bovina (patinho grelhado)',  kcal: 219, protein: 33.7, carbs: 0.0,  fat: 8.9, fiber: 0.0 },
  { name: 'Filé de tilápia grelhado',         kcal: 96,  protein: 20.8, carbs: 0.0,  fat: 1.7, fiber: 0.0 },
  { name: 'Salmão grelhado',                  kcal: 183, protein: 23.8, carbs: 0.0,  fat: 9.2, fiber: 0.0 },
  { name: 'Atum em água (enlatado)',          kcal: 119, protein: 26.0, carbs: 0.0,  fat: 1.1, fiber: 0.0 },
  { name: 'Ovo de galinha inteiro cozido',    kcal: 146, protein: 13.3, carbs: 0.6,  fat: 9.5, fiber: 0.0 },
  { name: 'Clara de ovo cozida',              kcal: 52,  protein: 10.9, carbs: 0.8,  fat: 0.0, fiber: 0.0 },
  { name: 'Leite integral',                   kcal: 61,  protein: 3.2,  carbs: 4.7,  fat: 3.2, fiber: 0.0 },
  { name: 'Leite desnatado',                  kcal: 35,  protein: 3.4,  carbs: 5.0,  fat: 0.2, fiber: 0.0 },
  { name: 'Iogurte natural integral',         kcal: 61,  protein: 3.5,  carbs: 4.9,  fat: 3.2, fiber: 0.0 },
  { name: 'Iogurte natural desnatado',        kcal: 43,  protein: 4.3,  carbs: 6.1,  fat: 0.2, fiber: 0.0 },
  { name: 'Queijo mussarela',                 kcal: 300, protein: 21.6, carbs: 2.0,  fat: 22.8, fiber: 0.0 },
  { name: 'Queijo cottage',                   kcal: 95,  protein: 11.1, carbs: 3.3,  fat: 4.3, fiber: 0.0 },
  { name: 'Whey protein (concentrado)',       kcal: 382, protein: 80.0, carbs: 8.0,  fat: 5.0, fiber: 0.0 },
  { name: 'Banana prata',                     kcal: 98,  protein: 1.3,  carbs: 26.0, fat: 0.1, fiber: 2.0 },
  { name: 'Maçã',                             kcal: 56,  protein: 0.3,  carbs: 15.2, fat: 0.1, fiber: 1.3 },
  { name: 'Laranja pera',                     kcal: 37,  protein: 0.9,  carbs: 8.9,  fat: 0.1, fiber: 0.8 },
  { name: 'Mamão papaia',                     kcal: 40,  protein: 0.5,  carbs: 10.4, fat: 0.1, fiber: 1.8 },
  { name: 'Morango',                          kcal: 30,  protein: 0.7,  carbs: 7.1,  fat: 0.3, fiber: 1.7 },
  { name: 'Abacate',                          kcal: 96,  protein: 1.2,  carbs: 6.0,  fat: 8.4, fiber: 6.3 },
  { name: 'Azeite de oliva extra virgem',     kcal: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0, fiber: 0.0 },
  { name: 'Amendoim torrado sem sal',         kcal: 581, protein: 26.4, carbs: 16.1, fat: 49.2, fiber: 8.5 },
  { name: 'Castanha-do-pará',                 kcal: 656, protein: 14.3, carbs: 15.1, fat: 63.5, fiber: 7.9 },
  { name: 'Espinafre cozido',                 kcal: 23,  protein: 3.0,  carbs: 3.4,  fat: 0.4, fiber: 2.2 },
  { name: 'Brócolis cozido',                  kcal: 29,  protein: 2.5,  carbs: 4.5,  fat: 0.4, fiber: 2.0 },
  { name: 'Cenoura crua',                     kcal: 34,  protein: 1.3,  carbs: 7.7,  fat: 0.2, fiber: 3.2 },
  { name: 'Tomate cru',                       kcal: 15,  protein: 0.9,  carbs: 3.1,  fat: 0.2, fiber: 1.2 },
  { name: 'Alface crespa crua',               kcal: 11,  protein: 1.3,  carbs: 1.7,  fat: 0.2, fiber: 1.3 },
  { name: 'Abobrinha cozida',                 kcal: 18,  protein: 1.5,  carbs: 2.9,  fat: 0.2, fiber: 1.2 },
  { name: 'Chuchu cozido',                    kcal: 24,  protein: 0.8,  carbs: 5.3,  fat: 0.2, fiber: 1.4 },
  { name: 'Batata inglesa cozida',            kcal: 52,  protein: 1.2,  carbs: 11.9, fat: 0.1, fiber: 1.8 },
  { name: 'Mandioca cozida',                  kcal: 125, protein: 1.1,  carbs: 30.1, fat: 0.3, fiber: 1.9 },
  { name: 'Cuscuz (milho, cozido)',           kcal: 74,  protein: 1.6,  carbs: 15.3, fat: 0.5, fiber: 0.8 },
  { name: 'Proteína de soja texturizada (hidratada)', kcal: 77, protein: 13.2, carbs: 5.8, fat: 0.5, fiber: 2.5 },
  { name: 'Queijo ricota',                    kcal: 135, protein: 9.4,  carbs: 3.1,  fat: 9.4, fiber: 0.0 },
  { name: 'Requeijão cremoso',                kcal: 255, protein: 8.6,  carbs: 4.0,  fat: 22.5, fiber: 0.0 },
  { name: 'Mel',                              kcal: 309, protein: 0.4,  carbs: 84.0, fat: 0.0, fiber: 0.2 },
  { name: 'Pasta de amendoim integral',       kcal: 598, protein: 25.1, carbs: 20.5, fat: 49.9, fiber: 6.0 },
].freeze

puts "\n🥦 Inserindo alimentos TACO..."
created_count = 0
FOODS_CATALOG.each do |attrs|
  next if Food.exists?(name: attrs[:name], account_id: nil)

  Food.create!(
    name:            attrs[:name],
    kcal_per_100g:   attrs[:kcal],
    protein_per_100g: attrs[:protein],
    carbs_per_100g:  attrs[:carbs],
    fat_per_100g:    attrs[:fat],
    fiber_per_100g:  attrs[:fiber],
    source:          'taco',
    account_id:      nil
  )
  created_count += 1
end
puts "  ✅ #{created_count} alimentos criados (#{Food.where(source: 'taco').count} total TACO)"

# ── 2. CONTATOS PACIENTES ─────────────────────────────────────────────────────

NUTRI_PATIENTS = [
  { first_name: 'Beatriz',   last_name: 'Almeida',    email: 'beatriz.almeida@teste.com',    phone: '(11) 91111-0001', birth_date: '1990-03-15' },
  { first_name: 'Leonardo',  last_name: 'Carvalho',   email: 'leonardo.carvalho@teste.com',  phone: '(11) 91111-0002', birth_date: '1985-07-22' },
  { first_name: 'Camila',    last_name: 'Ferreira',   email: 'camila.ferreira@teste.com',    phone: '(11) 91111-0003', birth_date: '1995-11-08' },
  { first_name: 'Rafael',    last_name: 'Mendes',     email: 'rafael.mendes@teste.com',      phone: '(11) 91111-0004', birth_date: '1988-01-30' },
  { first_name: 'Juliana',   last_name: 'Rocha',      email: 'juliana.rocha@teste.com',      phone: '(11) 91111-0005', birth_date: '1992-06-14' },
  { first_name: 'Thiago',    last_name: 'Nascimento', email: 'thiago.nascimento@teste.com',  phone: '(11) 91111-0006', birth_date: '1980-09-03' },
  { first_name: 'Isabela',   last_name: 'Lima',       email: 'isabela.lima@teste.com',       phone: '(11) 91111-0007', birth_date: '1997-04-25' },
  { first_name: 'Gustavo',   last_name: 'Araújo',     email: 'gustavo.araujo@teste.com',     phone: '(11) 91111-0008', birth_date: '1975-12-17' },
  { first_name: 'Larissa',   last_name: 'Monteiro',   email: 'larissa.monteiro@teste.com',   phone: '(11) 91111-0009', birth_date: '1993-08-11' },
  { first_name: 'André',     last_name: 'Souza',      email: 'andre.souza@teste.com',        phone: '(11) 91111-0010', birth_date: '1982-05-29' },
].freeze

puts "\n👤 Criando pacientes..."
contacts = []
NUTRI_PATIENTS.each do |p|
  contact = account.contacts.find_or_initialize_by(email: p[:email])
  if contact.new_record?
    contact.assign_attributes(
      first_name:   p[:first_name],
      last_name:    p[:last_name],
      phone_number: p[:phone],
      email:        p[:email],
      birth_date:   p[:birth_date],
      person_type:  :natural,
      contact_type: :customer
    )
    contact.save!
    puts "  ✅ #{contact.name}"
  else
    puts "  ℹ️  já existe: #{contact.name}"
  end
  contacts << contact
end

# ── 3. PLANOS ALIMENTARES ─────────────────────────────────────────────────────

PLAN_TEMPLATES = [
  {
    title: 'Plano de Emagrecimento — Déficit Calórico Moderado',
    description: 'Plano hipocalórico com déficit de ~500kcal/dia. Alta proteína para preservar massa muscular.',
    notes: 'Paciente deve evitar alimentos ultraprocessados. Hidratação mínima de 2L/dia.',
    status: :active,
    days: [
      {
        label: 'Segunda-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Aveia em flocos', 40], ['Banana prata', 100], ['Leite desnatado', 200]] },
          { name: 'Lanche da manhã',  time: '10:00', foods: [['Maçã', 150], ['Queijo cottage', 100]] },
          { name: 'Almoço',           time: '12:30', foods: [['Arroz integral cozido', 150], ['Feijão carioca cozido', 100], ['Frango grelhado (peito sem pele)', 120], ['Alface crespa crua', 50], ['Tomate cru', 80]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Iogurte natural desnatado', 170], ['Morango', 100]] },
          { name: 'Jantar',           time: '19:30', foods: [['Filé de tilápia grelhado', 150], ['Batata doce cozida', 120], ['Brócolis cozido', 100], ['Azeite de oliva extra virgem', 10]] },
        ]
      },
      {
        label: 'Terça-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Pão de forma integral', 60], ['Queijo cottage', 80], ['Mamão papaia', 150]] },
          { name: 'Lanche da manhã',  time: '10:00', foods: [['Castanha-do-pará', 30]] },
          { name: 'Almoço',           time: '12:30', foods: [['Arroz branco cozido', 130], ['Lentilha cozida', 100], ['Carne bovina (patinho grelhado)', 120], ['Cenoura crua', 80], ['Tomate cru', 80]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Banana prata', 100], ['Pasta de amendoim integral', 30]] },
          { name: 'Jantar',           time: '19:30', foods: [['Ovo de galinha inteiro cozido', 120], ['Espinafre cozido', 80], ['Batata inglesa cozida', 100]] },
        ]
      },
      {
        label: 'Quarta-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Aveia em flocos', 40], ['Iogurte natural desnatado', 170], ['Morango', 80]] },
          { name: 'Lanche da manhã',  time: '10:00', foods: [['Laranja pera', 180]] },
          { name: 'Almoço',           time: '12:30', foods: [['Macarrão cozido', 150], ['Frango grelhado (peito sem pele)', 130], ['Tomate cru', 100], ['Azeite de oliva extra virgem', 10]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Queijo cottage', 100], ['Maçã', 130]] },
          { name: 'Jantar',           time: '19:30', foods: [['Salmão grelhado', 150], ['Abobrinha cozida', 100], ['Arroz integral cozido', 100]] },
        ]
      },
      {
        label: 'Quinta-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Tapioca (goma hidratada)', 80], ['Clara de ovo cozida', 120], ['Queijo mussarela', 30]] },
          { name: 'Lanche da manhã',  time: '10:00', foods: [['Banana prata', 100], ['Amendoim torrado sem sal', 30]] },
          { name: 'Almoço',           time: '12:30', foods: [['Arroz integral cozido', 150], ['Feijão preto cozido', 100], ['Carne bovina (patinho grelhado)', 120], ['Alface crespa crua', 50], ['Cenoura crua', 60]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Iogurte natural desnatado', 170], ['Abacate', 60]] },
          { name: 'Jantar',           time: '19:30', foods: [['Atum em água (enlatado)', 120], ['Batata doce cozida', 120], ['Brócolis cozido', 100]] },
        ]
      },
      {
        label: 'Sexta-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Pão francês', 50], ['Requeijão cremoso', 20], ['Mamão papaia', 150]] },
          { name: 'Lanche da manhã',  time: '10:00', foods: [['Maçã', 150]] },
          { name: 'Almoço',           time: '12:30', foods: [['Arroz branco cozido', 130], ['Grão-de-bico cozido', 100], ['Frango grelhado (peito sem pele)', 130], ['Tomate cru', 80], ['Alface crespa crua', 50]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Queijo cottage', 100], ['Morango', 100]] },
          { name: 'Jantar',           time: '19:30', foods: [['Filé de tilápia grelhado', 150], ['Chuchu cozido', 100], ['Arroz integral cozido', 80]] },
        ]
      },
      {
        label: 'Sábado',
        meals: [
          { name: 'Café da manhã',    time: '08:00', foods: [['Aveia em flocos', 50], ['Banana prata', 100], ['Mel', 15], ['Leite integral', 200]] },
          { name: 'Almoço',           time: '13:00', foods: [['Arroz branco cozido', 150], ['Feijão carioca cozido', 100], ['Carne bovina (patinho grelhado)', 150], ['Mandioca cozida', 100], ['Alface crespa crua', 60]] },
          { name: 'Lanche da tarde',  time: '16:30', foods: [['Laranja pera', 180], ['Castanha-do-pará', 20]] },
          { name: 'Jantar',           time: '20:00', foods: [['Ovo de galinha inteiro cozido', 120], ['Cuscuz (milho, cozido)', 100], ['Tomate cru', 80]] },
        ]
      },
      {
        label: 'Domingo',
        meals: [
          { name: 'Café da manhã',    time: '08:30', foods: [['Pão de forma integral', 80], ['Queijo mussarela', 30], ['Mamão papaia', 200]] },
          { name: 'Almoço',           time: '13:30', foods: [['Arroz branco cozido', 150], ['Feijão preto cozido', 100], ['Salmão grelhado', 150], ['Brócolis cozido', 100], ['Azeite de oliva extra virgem', 10]] },
          { name: 'Lanche da tarde',  time: '17:00', foods: [['Iogurte natural integral', 170], ['Morango', 100], ['Mel', 10]] },
          { name: 'Jantar',           time: '20:00', foods: [['Proteína de soja texturizada (hidratada)', 100], ['Batata doce cozida', 120], ['Cenoura crua', 60]] },
        ]
      },
    ]
  },

  {
    title: 'Plano para Ganho de Massa — Hipertrofia',
    description: 'Plano hipercalórico com superávit de ~300kcal. Proteína elevada: 2g/kg de peso corporal.',
    notes: 'Horários de refeições pré e pós treino são prioritários. Suplementação de whey autorizada.',
    status: :active,
    days: [
      {
        label: 'Segunda-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Aveia em flocos', 60], ['Banana prata', 150], ['Leite integral', 250], ['Mel', 20]] },
          { name: 'Pré-treino',       time: '10:00', foods: [['Batata doce cozida', 150], ['Frango grelhado (peito sem pele)', 100]] },
          { name: 'Pós-treino',       time: '12:30', foods: [['Whey protein (concentrado)', 30], ['Banana prata', 100]] },
          { name: 'Almoço',           time: '13:30', foods: [['Arroz branco cozido', 200], ['Feijão carioca cozido', 100], ['Carne bovina (patinho grelhado)', 180], ['Alface crespa crua', 60], ['Tomate cru', 80], ['Azeite de oliva extra virgem', 10]] },
          { name: 'Lanche da tarde',  time: '16:30', foods: [['Iogurte natural integral', 200], ['Amendoim torrado sem sal', 40], ['Morango', 100]] },
          { name: 'Jantar',           time: '20:00', foods: [['Macarrão cozido', 180], ['Frango grelhado (peito sem pele)', 150], ['Queijo mussarela', 30], ['Tomate cru', 100]] },
          { name: 'Ceia',             time: '22:30', foods: [['Queijo cottage', 150], ['Castanha-do-pará', 20]] },
        ]
      },
      {
        label: 'Terça-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Pão de forma integral', 80], ['Ovos mexidos', 120], ['Queijo mussarela', 30], ['Mamão papaia', 200]] },
          { name: 'Lanche da manhã',  time: '10:00', foods: [['Pasta de amendoim integral', 40], ['Banana prata', 120]] },
          { name: 'Almoço',           time: '13:00', foods: [['Arroz integral cozido', 200], ['Lentilha cozida', 100], ['Salmão grelhado', 180], ['Brócolis cozido', 100], ['Azeite de oliva extra virgem', 15]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Whey protein (concentrado)', 30], ['Leite integral', 250]] },
          { name: 'Jantar',           time: '20:00', foods: [['Batata doce cozida', 200], ['Atum em água (enlatado)', 150], ['Cenoura crua', 80]] },
          { name: 'Ceia',             time: '22:30', foods: [['Iogurte natural integral', 200], ['Mel', 15]] },
        ]
      },
    ]
  },

  {
    title: 'Plano Low Carb — Controle Glicêmico',
    description: 'Dieta com restrição de carboidratos (<100g/dia). Indicado para controle de glicemia e insulina.',
    notes: 'Monitorar glicemia semanalmente. Permitir até 2 porções de fruta/dia (baixo IG).',
    status: :active,
    days: [
      {
        label: 'Segunda-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:30', foods: [['Ovo de galinha inteiro cozido', 200], ['Queijo mussarela', 30], ['Abacate', 80]] },
          { name: 'Almoço',           time: '12:30', foods: [['Frango grelhado (peito sem pele)', 180], ['Alface crespa crua', 80], ['Tomate cru', 100], ['Azeite de oliva extra virgem', 15], ['Brócolis cozido', 120]] },
          { name: 'Lanche da tarde',  time: '15:30', foods: [['Queijo cottage', 120], ['Castanha-do-pará', 30]] },
          { name: 'Jantar',           time: '19:30', foods: [['Salmão grelhado', 180], ['Espinafre cozido', 100], ['Abobrinha cozida', 100], ['Azeite de oliva extra virgem', 10]] },
        ]
      },
    ]
  },

  {
    title: 'Plano Vegetariano Balanceado',
    description: 'Plano plant-based rico em proteínas vegetais. Suplementação de B12 e ferro orientada.',
    notes: 'Combinar leguminosas + cereais em todas as refeições para perfil proteico completo.',
    status: :draft,
    days: [
      {
        label: 'Segunda-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Aveia em flocos', 50], ['Leite desnatado', 200], ['Banana prata', 100], ['Mel', 15]] },
          { name: 'Almoço',           time: '12:30', foods: [['Arroz integral cozido', 150], ['Feijão carioca cozido', 120], ['Proteína de soja texturizada (hidratada)', 80], ['Alface crespa crua', 60], ['Tomate cru', 80], ['Azeite de oliva extra virgem', 10]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Iogurte natural desnatado', 170], ['Morango', 100], ['Granola', 30]] },
          { name: 'Jantar',           time: '19:30', foods: [['Lentilha cozida', 150], ['Espinafre cozido', 100], ['Ovo de galinha inteiro cozido', 120], ['Tomate cru', 60]] },
        ]
      },
      {
        label: 'Terça-feira',
        meals: [
          { name: 'Café da manhã',    time: '07:00', foods: [['Tapioca (goma hidratada)', 80], ['Queijo cottage', 80], ['Mamão papaia', 150]] },
          { name: 'Almoço',           time: '12:30', foods: [['Cuscuz (milho, cozido)', 150], ['Grão-de-bico cozido', 120], ['Cenoura crua', 80], ['Requeijão cremoso', 20]] },
          { name: 'Lanche da tarde',  time: '16:00', foods: [['Banana prata', 100], ['Amendoim torrado sem sal', 30]] },
          { name: 'Jantar',           time: '19:30', foods: [['Macarrão cozido', 130], ['Queijo ricota', 80], ['Tomate cru', 100], ['Azeite de oliva extra virgem', 10]] },
        ]
      },
    ]
  },
].freeze

puts "\n📋 Criando planos alimentares..."
plan_count    = 0
archived_plans = 0

contacts.each_with_index do |contact, idx|
  num_plans = (idx % 3) + 1

  num_plans.times do |plan_idx|
    template = PLAN_TEMPLATES[plan_idx % PLAN_TEMPLATES.size]

    plan = account.meal_plans.find_or_initialize_by(
      contact_id: contact.id,
      title:      template[:title]
    )

    next unless plan.new_record?

    plan.assign_attributes(
      description: template[:description],
      notes:       template[:notes],
      status:      template[:status],
      start_date:  Date.today - (30 * plan_idx),
      end_date:    Date.today + (30 - (15 * plan_idx))
    )
    plan.save!

    template[:days].each_with_index do |day_data, day_idx|
      day = plan.meal_plan_days.create!(
        day_number: day_idx + 1,
        label:      day_data[:label]
      )

      day_data[:meals].each_with_index do |meal_data, meal_idx|
        meal = day.meals.create!(
          name:            meal_data[:name],
          time_suggestion: meal_data[:time],
          position:        meal_idx
        )

        meal_data[:foods].each_with_index do |(food_name, qty), food_idx|
          food = Food.find_by('unaccent(name) ILIKE unaccent(?)', food_name) ||
                 Food.where('unaccent(name) ILIKE unaccent(?)', "%#{food_name.split.first}%").first
          next unless food

          meal.meal_foods.create!(
            food:     food,
            quantity: qty,
            unit:     'g',
            position: food_idx
          )
        end
      end
    end

    plan_count += 1
    status_label = plan.active? ? '🟢 ativo' : (plan.draft? ? '📝 rascunho' : '📦 arquivado')
    puts "  ✅ [#{contact.name}] #{plan.title[0..40]}... (#{status_label})"
  end

  # Plano arquivado histórico para os primeiros 5 contatos
  next if idx >= 5

  old_plan = account.meal_plans.find_or_initialize_by(
    contact_id: contact.id,
    title:      "Plano Inicial — #{contact.first_name} (histórico)"
  )
  if old_plan.new_record?
    old_plan.assign_attributes(
      description: 'Plano de avaliação inicial do paciente.',
      status:      :archived,
      start_date:  Date.today - 90,
      end_date:    Date.today - 60
    )
    old_plan.save!

    day = old_plan.meal_plan_days.create!(day_number: 1, label: 'Segunda-feira')
    meal = day.meals.create!(name: 'Café da manhã', position: 0)
    food = Food.where(source: 'taco').first
    meal.meal_foods.create!(food: food, quantity: 50, unit: 'g', position: 0) if food

    archived_plans += 1
    puts "  📦 [#{contact.name}] Plano histórico arquivado"
  end
end

puts "\n" + "=" * 80
puts "✅ PLANOS ALIMENTARES CRIADOS"
puts "   Alimentos TACO: #{Food.where(source: 'taco').count}"
puts "   Contatos/pacientes: #{contacts.count}"
puts "   Planos criados agora: #{plan_count}"
puts "   Planos arquivados: #{archived_plans}"
puts "   Total de planos na conta: #{account.meal_plans.count}"
puts "=" * 80
