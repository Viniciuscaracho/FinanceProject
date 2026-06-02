# frozen_string_literal: true

module MealPlans
  class ImportSystemTemplates < ApplicationService
    TEMPLATES = [
      {
        title: 'Low Carb — Emagrecimento',
        description: 'Protocolo low carb para emagrecimento saudável. ~1600kcal, baixo carboidrato, alto proteína.',
        template_category: 'low_carb',
        days: [
          { label: 'Dia Tipo A', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Queijo cottage', qty: 80 }, { name: 'Tomate', qty: 100 }] },
            { name: 'Lanche da manhã', time: '10:00', foods: [{ name: 'Castanha-do-pará', qty: 30 }] },
            { name: 'Almoço',          time: '12:30', foods: [{ name: 'Frango grelhado (peito sem pele)', qty: 180 }, { name: 'Brócolis cozido', qty: 150 }, { name: 'Abobrinha cozida', qty: 100 }, { name: 'Azeite de oliva', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Morango', qty: 100 }] },
            { name: 'Jantar',          time: '19:30', foods: [{ name: 'Salmão grelhado', qty: 150 }, { name: 'Espinafre cozido', qty: 120 }, { name: 'Azeite de oliva', qty: 10 }] },
          ]},
          { label: 'Dia Tipo B', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Abacate', qty: 80 }] },
            { name: 'Lanche da manhã', time: '10:00', foods: [{ name: 'Amêndoa', qty: 30 }] },
            { name: 'Almoço',          time: '12:30', foods: [{ name: 'Carne bovina magra grelhada', qty: 180 }, { name: 'Couve refogada', qty: 100 }, { name: 'Alface', qty: 60 }, { name: 'Azeite de oliva', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Queijo cottage', qty: 100 }, { name: 'Pepino', qty: 100 }] },
            { name: 'Jantar',          time: '19:30', foods: [{ name: 'Atum em lata ao natural', qty: 120 }, { name: 'Brócolis cozido', qty: 150 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva', qty: 10 }] },
          ]},
        ]
      },
      {
        title: 'Hipertrofia — Ganho de Massa',
        description: 'Protocolo hipercalórico para ganho de massa muscular. ~2800kcal, alta proteína e carboidrato.',
        template_category: 'hipertrofia',
        days: [
          { label: 'Dia de Treino', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Aveia em flocos', qty: 80 }, { name: 'Ovo de galinha inteiro cozido', qty: 200 }, { name: 'Banana', qty: 120 }] },
            { name: 'Pré-treino',      time: '10:00', foods: [{ name: 'Batata-doce cozida', qty: 200 }, { name: 'Frango grelhado (peito sem pele)', qty: 120 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 200 }, { name: 'Feijão carioca cozido', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Azeite de oliva', qty: 10 }] },
            { name: 'Pós-treino',      time: '17:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 200 }, { name: 'Arroz branco cozido', qty: 100 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Carne bovina magra grelhada', qty: 200 }, { name: 'Batata-doce cozida', qty: 150 }, { name: 'Brócolis cozido', qty: 100 }] },
            { name: 'Ceia',            time: '22:30', foods: [{ name: 'Iogurte natural desnatado', qty: 200 }, { name: 'Castanha-do-pará', qty: 30 }] },
          ]},
          { label: 'Dia de Descanso', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Aveia em flocos', qty: 60 }, { name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Mamão', qty: 150 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 150 }, { name: 'Feijão carioca cozido', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 180 }, { name: 'Azeite de oliva', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:30', foods: [{ name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Banana', qty: 100 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Salmão grelhado', qty: 180 }, { name: 'Arroz branco cozido', qty: 100 }, { name: 'Brócolis cozido', qty: 100 }] },
          ]},
        ]
      },
      {
        title: 'Mediterrâneo — Equilíbrio',
        description: 'Dieta mediterrânea equilibrada. ~2000kcal, rica em gorduras boas e vegetais.',
        template_category: 'mediterraneo',
        days: [
          { label: 'Dia Tipo A', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Pão integral', qty: 60 }, { name: 'Ovo de galinha inteiro cozido', qty: 100 }, { name: 'Tomate', qty: 100 }, { name: 'Azeite de oliva', qty: 10 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz integral cozido', qty: 150 }, { name: 'Grão-de-bico cozido', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 150 }, { name: 'Alface', qty: 60 }, { name: 'Tomate', qty: 80 }, { name: 'Azeite de oliva', qty: 15 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Castanha-do-pará', qty: 30 }, { name: 'Uva', qty: 150 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Salmão grelhado', qty: 150 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva', qty: 10 }] },
          ]},
          { label: 'Dia Tipo B', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Aveia em flocos', qty: 50 }, { name: 'Iogurte natural desnatado', qty: 150 }, { name: 'Banana', qty: 100 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Macarrão integral cozido', qty: 150 }, { name: 'Atum em lata ao natural', qty: 120 }, { name: 'Tomate', qty: 100 }, { name: 'Azeite de oliva', qty: 15 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Amêndoa', qty: 30 }, { name: 'Morango', qty: 150 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Carne bovina magra grelhada', qty: 150 }, { name: 'Brócolis cozido', qty: 120 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva', qty: 10 }] },
          ]},
        ]
      },
      {
        title: 'Vegetariano — Equilibrado',
        description: 'Plano vegetariano equilibrado. ~1800kcal, rica em proteínas vegetais e ferro.',
        template_category: 'vegetariano',
        days: [
          { label: 'Dia Tipo A', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Aveia em flocos', qty: 60 }, { name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Banana', qty: 120 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz integral cozido', qty: 150 }, { name: 'Feijão carioca cozido', qty: 120 }, { name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Couve refogada', qty: 80 }, { name: 'Azeite de oliva', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Castanha-do-pará', qty: 30 }, { name: 'Maçã', qty: 150 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Tomate', qty: 100 }, { name: 'Azeite de oliva', qty: 10 }] },
          ]},
          { label: 'Dia Tipo B', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Pão integral', qty: 60 }, { name: 'Queijo cottage', qty: 80 }, { name: 'Tomate', qty: 100 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 150 }, { name: 'Grão-de-bico cozido', qty: 150 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva', qty: 15 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Morango', qty: 100 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 200 }, { name: 'Brócolis cozido', qty: 150 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva', qty: 10 }] },
          ]},
        ]
      },
    ].freeze

    def call
      account = context.account
      imported = 0

      TEMPLATES.each do |tpl|
        next if account.meal_plans.templates.exists?(title: tpl[:title])

        ApplicationRecord.transaction do
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
        end

        imported += 1
      end

      context.imported = imported
    end
  end
end
