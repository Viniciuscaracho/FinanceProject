# frozen_string_literal: true
# Seeds de templates de plano alimentar por conta
# Executar via: rails runner "load 'db/seeds/meal_plan_templates.rb'"

SYSTEM_TEMPLATES = [
  {
    title: 'Low Carb — Emagrecimento',
    description: 'Protocolo low carb para emagrecimento saudável. ~1600kcal, baixo carboidrato, alto proteína.',
    template_category: 'low_carb',
    days: [
      {
        label: 'Dia Tipo A',
        meals: [
          { name: 'Café da manhã', time: '07:00', foods: [
            { name: 'Ovo de galinha inteiro cozido', qty: 150 },
            { name: 'Queijo cottage',                qty: 80  },
            { name: 'Tomate',                        qty: 100 },
          ]},
          { name: 'Lanche da manhã', time: '10:00', foods: [
            { name: 'Castanha-do-pará', qty: 30 },
          ]},
          { name: 'Almoço', time: '12:30', foods: [
            { name: 'Frango grelhado (peito sem pele)', qty: 180 },
            { name: 'Brócolis cozido',                 qty: 150 },
            { name: 'Abobrinha cozida',                qty: 100 },
            { name: 'Azeite de oliva',                 qty: 10  },
          ]},
          { name: 'Lanche da tarde', time: '16:00', foods: [
            { name: 'Iogurte natural desnatado', qty: 170 },
            { name: 'Morango',                   qty: 100 },
          ]},
          { name: 'Jantar', time: '19:30', foods: [
            { name: 'Salmão grelhado',    qty: 150 },
            { name: 'Espinafre cozido',   qty: 120 },
            { name: 'Azeite de oliva',    qty: 10  },
          ]},
        ]
      },
      {
        label: 'Dia Tipo B',
        meals: [
          { name: 'Café da manhã', time: '07:00', foods: [
            { name: 'Ovo de galinha inteiro cozido', qty: 120 },
            { name: 'Queijo ricota',                 qty: 60  },
            { name: 'Alface',                        qty: 50  },
            { name: 'Tomate',                        qty: 80  },
          ]},
          { name: 'Almoço', time: '12:30', foods: [
            { name: 'Carne bovina (patinho grelhado)', qty: 160 },
            { name: 'Couve refogada',                  qty: 100 },
            { name: 'Abobrinha cozida',                qty: 150 },
            { name: 'Azeite de oliva',                 qty: 10  },
          ]},
          { name: 'Lanche da tarde', time: '16:00', foods: [
            { name: 'Amêndoa torrada', qty: 30 },
          ]},
          { name: 'Jantar', time: '19:30', foods: [
            { name: 'Atum em água (enlatado)', qty: 120 },
            { name: 'Alface',                  qty: 80  },
            { name: 'Tomate',                  qty: 100 },
            { name: 'Azeite de oliva',         qty: 10  },
          ]},
        ]
      },
    ]
  },

  {
    title: 'Hipertrofia — Ganho de Massa',
    description: 'Protocolo hipercalórico para hipertrofia muscular. ~2800kcal, alto proteína e carboidrato.',
    template_category: 'hipertrofia',
    days: [
      {
        label: 'Dia Treino',
        meals: [
          { name: 'Café da manhã', time: '07:00', foods: [
            { name: 'Aveia em flocos',               qty: 80  },
            { name: 'Ovo de galinha inteiro cozido', qty: 150 },
            { name: 'Banana prata',                  qty: 120 },
          ]},
          { name: 'Pré-treino', time: '10:00', foods: [
            { name: 'Batata doce cozida',            qty: 200 },
            { name: 'Frango grelhado (peito sem pele)', qty: 120 },
          ]},
          { name: 'Almoço', time: '13:00', foods: [
            { name: 'Arroz branco cozido',           qty: 200 },
            { name: 'Feijão carioca cozido',         qty: 100 },
            { name: 'Frango grelhado (peito sem pele)', qty: 200 },
            { name: 'Brócolis cozido',               qty: 100 },
            { name: 'Azeite de oliva',               qty: 10  },
          ]},
          { name: 'Pós-treino', time: '17:00', foods: [
            { name: 'Whey protein (concentrado)', qty: 40  },
            { name: 'Banana prata',               qty: 150 },
          ]},
          { name: 'Jantar', time: '20:00', foods: [
            { name: 'Arroz integral cozido',          qty: 150 },
            { name: 'Carne bovina (patinho grelhado)', qty: 180 },
            { name: 'Abobrinha cozida',               qty: 120 },
          ]},
          { name: 'Ceia', time: '22:30', foods: [
            { name: 'Queijo cottage', qty: 150 },
          ]},
        ]
      },
      {
        label: 'Dia Descanso',
        meals: [
          { name: 'Café da manhã', time: '07:30', foods: [
            { name: 'Aveia em flocos',               qty: 60  },
            { name: 'Ovo de galinha inteiro cozido', qty: 120 },
            { name: 'Maçã com casca',                qty: 150 },
          ]},
          { name: 'Lanche da manhã', time: '10:30', foods: [
            { name: 'Iogurte natural integral', qty: 200 },
            { name: 'Amendoim torrado',         qty: 30  },
          ]},
          { name: 'Almoço', time: '13:00', foods: [
            { name: 'Arroz branco cozido',             qty: 150 },
            { name: 'Feijão preto cozido',             qty: 100 },
            { name: 'Carne bovina (patinho grelhado)', qty: 160 },
            { name: 'Couve refogada',                  qty: 80  },
            { name: 'Azeite de oliva',                 qty: 10  },
          ]},
          { name: 'Lanche da tarde', time: '16:00', foods: [
            { name: 'Banana prata',            qty: 120 },
            { name: 'Pasta de amendoim',       qty: 30  },
          ]},
          { name: 'Jantar', time: '19:30', foods: [
            { name: 'Frango grelhado (peito sem pele)', qty: 180 },
            { name: 'Batata doce cozida',              qty: 150 },
            { name: 'Brócolis cozido',                 qty: 100 },
          ]},
        ]
      },
    ]
  },

  {
    title: 'Mediterrâneo — Equilíbrio',
    description: 'Dieta mediterrânea anti-inflamatória e equilibrada. ~2000kcal.',
    template_category: 'mediterraneo',
    days: [
      {
        label: 'Dia Tipo A',
        meals: [
          { name: 'Café da manhã', time: '08:00', foods: [
            { name: 'Pão de forma integral', qty: 60  },
            { name: 'Ovo de galinha inteiro cozido', qty: 100 },
            { name: 'Tomate',                qty: 100 },
            { name: 'Azeite de oliva',       qty: 10  },
          ]},
          { name: 'Lanche da manhã', time: '10:30', foods: [
            { name: 'Maçã com casca',   qty: 150 },
            { name: 'Amêndoa torrada',  qty: 20  },
          ]},
          { name: 'Almoço', time: '13:00', foods: [
            { name: 'Grão-de-bico cozido', qty: 120 },
            { name: 'Salmão grelhado',     qty: 150 },
            { name: 'Tomate',              qty: 100 },
            { name: 'Alface',              qty: 60  },
            { name: 'Azeite de oliva',     qty: 15  },
          ]},
          { name: 'Lanche da tarde', time: '16:30', foods: [
            { name: 'Iogurte natural integral', qty: 150 },
            { name: 'Morango',                  qty: 100 },
          ]},
          { name: 'Jantar', time: '20:00', foods: [
            { name: 'Filé de tilápia grelhado', qty: 160 },
            { name: 'Abobrinha cozida',         qty: 150 },
            { name: 'Cenoura crua',             qty: 80  },
            { name: 'Azeite de oliva',          qty: 10  },
          ]},
        ]
      },
      {
        label: 'Dia Tipo B',
        meals: [
          { name: 'Café da manhã', time: '08:00', foods: [
            { name: 'Aveia em flocos',  qty: 50  },
            { name: 'Laranja pera',     qty: 150 },
            { name: 'Castanha-do-pará', qty: 20  },
          ]},
          { name: 'Almoço', time: '13:00', foods: [
            { name: 'Lentilha cozida',                 qty: 150 },
            { name: 'Frango grelhado (peito sem pele)', qty: 140 },
            { name: 'Espinafre cozido',                qty: 100 },
            { name: 'Tomate',                          qty: 100 },
            { name: 'Azeite de oliva',                 qty: 15  },
          ]},
          { name: 'Lanche da tarde', time: '16:30', foods: [
            { name: 'Abacate',   qty: 80  },
            { name: 'Pão francês', qty: 40 },
          ]},
          { name: 'Jantar', time: '20:00', foods: [
            { name: 'Atum em água (enlatado)', qty: 120 },
            { name: 'Batata inglesa cozida',   qty: 150 },
            { name: 'Couve-flor cozida',       qty: 150 },
            { name: 'Azeite de oliva',         qty: 10  },
          ]},
        ]
      },
    ]
  },

  {
    title: 'Vegetariano — Equilibrado',
    description: 'Dieta vegetariana completa e equilibrada. ~1800kcal, atenção à proteína e ferro.',
    template_category: 'vegetariano',
    days: [
      {
        label: 'Dia Tipo A',
        meals: [
          { name: 'Café da manhã', time: '07:30', foods: [
            { name: 'Aveia em flocos',               qty: 60  },
            { name: 'Ovo de galinha inteiro cozido', qty: 120 },
            { name: 'Banana prata',                  qty: 100 },
          ]},
          { name: 'Lanche da manhã', time: '10:00', foods: [
            { name: 'Iogurte natural integral', qty: 170 },
            { name: 'Morango',                  qty: 100 },
          ]},
          { name: 'Almoço', time: '12:30', foods: [
            { name: 'Arroz integral cozido',  qty: 150 },
            { name: 'Lentilha cozida',        qty: 150 },
            { name: 'Espinafre cozido',       qty: 120 },
            { name: 'Cenoura crua',           qty: 80  },
            { name: 'Azeite de oliva',        qty: 10  },
          ]},
          { name: 'Lanche da tarde', time: '16:00', foods: [
            { name: 'Queijo cottage', qty: 100 },
            { name: 'Maçã com casca', qty: 150 },
          ]},
          { name: 'Jantar', time: '19:30', foods: [
            { name: 'Ovo de galinha inteiro cozido', qty: 150 },
            { name: 'Batata doce cozida',            qty: 150 },
            { name: 'Brócolis cozido',               qty: 120 },
            { name: 'Azeite de oliva',               qty: 10  },
          ]},
        ]
      },
      {
        label: 'Dia Tipo B',
        meals: [
          { name: 'Café da manhã', time: '07:30', foods: [
            { name: 'Pão de forma integral',         qty: 60  },
            { name: 'Ovo de galinha inteiro cozido', qty: 100 },
            { name: 'Queijo mussarela',              qty: 30  },
            { name: 'Tomate',                        qty: 80  },
          ]},
          { name: 'Almoço', time: '12:30', foods: [
            { name: 'Grão-de-bico cozido', qty: 150 },
            { name: 'Quinoa cozida',       qty: 100 },
            { name: 'Couve refogada',      qty: 100 },
            { name: 'Beterraba crua',      qty: 80  },
            { name: 'Azeite de oliva',     qty: 10  },
          ]},
          { name: 'Lanche da tarde', time: '16:00', foods: [
            { name: 'Pasta de amendoim', qty: 30  },
            { name: 'Banana prata',      qty: 120 },
          ]},
          { name: 'Jantar', time: '19:30', foods: [
            { name: 'Macarrão integral cozido',      qty: 150 },
            { name: 'Ovo de galinha inteiro cozido', qty: 100 },
            { name: 'Abobrinha cozida',              qty: 120 },
            { name: 'Azeite de oliva',               qty: 10  },
          ]},
        ]
      },
    ]
  },
].freeze

def seed_templates_for(account)
  SYSTEM_TEMPLATES.each do |tpl|
    next if account.meal_plans.templates.exists?(title: tpl[:title])

    plan = account.meal_plans.create!(
      title:             tpl[:title],
      description:       tpl[:description],
      template_category: tpl[:template_category],
      is_template:       true
    )

    tpl[:days].each_with_index do |day_data, idx|
      day = plan.meal_plan_days.create!(day_number: idx + 1, label: day_data[:label])

      day_data[:meals].each_with_index do |meal_data, pos|
        meal = day.meals.create!(
          name:            meal_data[:name],
          time_suggestion: meal_data[:time],
          position:        pos
        )

        meal_data[:foods].each_with_index do |food_data, fpos|
          food = Food.global.find_by(name: food_data[:name])
          next unless food

          meal.meal_foods.create!(
            food:     food,
            quantity: food_data[:qty],
            unit:     'g',
            position: fpos
          )
        end
      end
    end

    puts "  ✅ Template '#{tpl[:title]}' criado para #{account.company&.name || account.id}"
  end
end

ActsAsTenant.without_tenant do
  accounts = Account.all
  puts "Semeando #{SYSTEM_TEMPLATES.size} templates para #{accounts.count} conta(s)..."
  accounts.each { |acc| seed_templates_for(acc) }
end

puts "✅ Templates criados."
