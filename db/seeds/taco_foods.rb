# frozen_string_literal: true
# Tabela Brasileira de Composição de Alimentos (TACO) — UNICAMP
# Valores por 100g do alimento
# vitamins: vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg, vitamin_b12_mcg,
#           calcium_mg, iron_mg, sodium_mg, potassium_mg, magnesium_mg, zinc_mg

TACO_FOODS = [
  # Cereais e derivados
  { name: 'Arroz branco cozido',           kcal: 128, protein: 2.5,  carbs: 28.1, fat: 0.2, fiber: 1.6,
    vitamins: { sodium_mg: 1, potassium_mg: 26, magnesium_mg: 8, iron_mg: 0.1, zinc_mg: 0.5 } },
  { name: 'Arroz integral cozido',         kcal: 124, protein: 2.6,  carbs: 25.8, fat: 1.0, fiber: 2.7,
    vitamins: { sodium_mg: 1, potassium_mg: 79, magnesium_mg: 43, iron_mg: 0.4, zinc_mg: 0.6 } },
  { name: 'Aveia em flocos',               kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1,
    vitamins: { calcium_mg: 54, iron_mg: 4.7, potassium_mg: 429, magnesium_mg: 177, zinc_mg: 3.6 } },
  { name: 'Pão francês',                   kcal: 300, protein: 8.0,  carbs: 58.6, fat: 3.1, fiber: 2.3,
    vitamins: { sodium_mg: 604, calcium_mg: 24, iron_mg: 2.5, potassium_mg: 100 } },
  { name: 'Pão de forma integral',         kcal: 253, protein: 8.2,  carbs: 43.9, fat: 4.8, fiber: 5.9,
    vitamins: { sodium_mg: 450, calcium_mg: 60, iron_mg: 2.8, potassium_mg: 180, magnesium_mg: 45 } },
  { name: 'Macarrão cozido',               kcal: 113, protein: 3.7,  carbs: 22.7, fat: 0.5, fiber: 1.3,
    vitamins: { sodium_mg: 1, iron_mg: 0.5, potassium_mg: 44 } },
  { name: 'Macarrão integral cozido',      kcal: 116, protein: 4.5,  carbs: 22.1, fat: 0.9, fiber: 3.5,
    vitamins: { iron_mg: 1.2, potassium_mg: 80, magnesium_mg: 28, zinc_mg: 1.0 } },
  { name: 'Farinha de trigo',              kcal: 360, protein: 9.8,  carbs: 75.1, fat: 1.4, fiber: 2.3,
    vitamins: { iron_mg: 3.0, calcium_mg: 15, sodium_mg: 2 } },
  { name: 'Farinha de mandioca torrada',   kcal: 361, protein: 1.5,  carbs: 87.7, fat: 0.3, fiber: 6.4,
    vitamins: { potassium_mg: 165, calcium_mg: 16, iron_mg: 1.4 } },
  { name: 'Tapioca (goma hidratada)',      kcal: 62,  protein: 0.1,  carbs: 15.3, fat: 0.0, fiber: 0.1,
    vitamins: {} },
  { name: 'Cuscuz (milho, cozido)',        kcal: 74,  protein: 1.6,  carbs: 15.3, fat: 0.5, fiber: 0.8,
    vitamins: { iron_mg: 0.8, potassium_mg: 55 } },
  { name: 'Batata doce cozida',            kcal: 77,  protein: 1.4,  carbs: 17.6, fat: 0.1, fiber: 2.5,
    vitamins: { vitamin_a_mcg: 709, vitamin_c_mg: 13, potassium_mg: 230, calcium_mg: 30, iron_mg: 0.5 } },

  # Leguminosas
  { name: 'Feijão carioca cozido',         kcal: 76,  protein: 4.8,  carbs: 13.6, fat: 0.5, fiber: 8.5,
    vitamins: { iron_mg: 1.7, calcium_mg: 27, potassium_mg: 255, magnesium_mg: 37, zinc_mg: 0.9 } },
  { name: 'Feijão preto cozido',           kcal: 77,  protein: 4.5,  carbs: 14.0, fat: 0.5, fiber: 8.4,
    vitamins: { iron_mg: 1.5, calcium_mg: 22, potassium_mg: 255, magnesium_mg: 38, zinc_mg: 1.0 } },
  { name: 'Lentilha cozida',               kcal: 93,  protein: 6.3,  carbs: 15.6, fat: 0.5, fiber: 3.7,
    vitamins: { iron_mg: 3.3, calcium_mg: 19, potassium_mg: 369, magnesium_mg: 36, zinc_mg: 1.3 } },
  { name: 'Grão-de-bico cozido',           kcal: 164, protein: 8.9,  carbs: 27.4, fat: 2.6, fiber: 6.4,
    vitamins: { iron_mg: 2.9, calcium_mg: 49, potassium_mg: 291, magnesium_mg: 48, zinc_mg: 1.5 } },
  { name: 'Ervilha cozida',                kcal: 74,  protein: 4.8,  carbs: 12.6, fat: 0.4, fiber: 4.7,
    vitamins: { vitamin_c_mg: 14, iron_mg: 1.5, calcium_mg: 26, potassium_mg: 271, magnesium_mg: 33 } },

  # Carnes e aves
  { name: 'Frango grelhado (peito sem pele)', kcal: 163, protein: 32.0, carbs: 0.0, fat: 3.2, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.3, iron_mg: 0.7, zinc_mg: 1.5, sodium_mg: 75, potassium_mg: 294, magnesium_mg: 29 } },
  { name: 'Carne bovina (patinho grelhado)',  kcal: 219, protein: 33.7, carbs: 0.0, fat: 8.9, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 2.1, iron_mg: 3.5, zinc_mg: 4.7, sodium_mg: 59, potassium_mg: 345, magnesium_mg: 22 } },
  { name: 'Carne bovina (acém cozido)',       kcal: 236, protein: 28.2, carbs: 0.0, fat: 13.5, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 2.4, iron_mg: 4.0, zinc_mg: 5.5, sodium_mg: 65, potassium_mg: 312, magnesium_mg: 20 } },
  { name: 'Filé de tilápia grelhado',         kcal: 96,  protein: 20.8, carbs: 0.0, fat: 1.7, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 1.4, iron_mg: 0.5, zinc_mg: 0.5, sodium_mg: 60, potassium_mg: 380, magnesium_mg: 27 } },
  { name: 'Salmão grelhado',                  kcal: 183, protein: 23.8, carbs: 0.0, fat: 9.2, fiber: 0.0,
    vitamins: { vitamin_d_mcg: 11.0, vitamin_b12_mcg: 3.2, iron_mg: 0.4, zinc_mg: 0.6, sodium_mg: 50, potassium_mg: 400, magnesium_mg: 29 } },
  { name: 'Atum em água (enlatado)',           kcal: 119, protein: 26.0, carbs: 0.0, fat: 1.1, fiber: 0.0,
    vitamins: { vitamin_d_mcg: 5.7, vitamin_b12_mcg: 2.5, iron_mg: 1.3, zinc_mg: 0.7, sodium_mg: 320, potassium_mg: 207 } },
  { name: 'Ovo de galinha inteiro cozido',     kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0.0,
    vitamins: { vitamin_a_mcg: 128, vitamin_d_mcg: 2.2, vitamin_b12_mcg: 1.1, calcium_mg: 53, iron_mg: 1.6, zinc_mg: 1.1, sodium_mg: 143, potassium_mg: 138 } },
  { name: 'Clara de ovo cozida',               kcal: 52,  protein: 10.9, carbs: 0.8, fat: 0.0, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.1, sodium_mg: 166, potassium_mg: 163, magnesium_mg: 11 } },
  { name: 'Linguiça de frango grelhada',       kcal: 197, protein: 15.8, carbs: 2.1, fat: 14.3, fiber: 0.0,
    vitamins: { iron_mg: 0.9, zinc_mg: 1.2, sodium_mg: 580, potassium_mg: 200 } },
  { name: 'Frango (coxa sem pele grelhada)',   kcal: 176, protein: 26.3, carbs: 0.0, fat: 7.3, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.4, iron_mg: 1.0, zinc_mg: 2.2, sodium_mg: 80, potassium_mg: 270, magnesium_mg: 24 } },

  # Laticínios
  { name: 'Leite integral',                kcal: 61,  protein: 3.2, carbs: 4.7,  fat: 3.2, fiber: 0.0,
    vitamins: { vitamin_a_mcg: 28, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.4, calcium_mg: 123, sodium_mg: 49, potassium_mg: 152, magnesium_mg: 13 } },
  { name: 'Leite desnatado',               kcal: 35,  protein: 3.4, carbs: 5.0,  fat: 0.2, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.4, calcium_mg: 125, sodium_mg: 52, potassium_mg: 156, magnesium_mg: 11 } },
  { name: 'Iogurte natural integral',      kcal: 61,  protein: 3.5, carbs: 4.9,  fat: 3.2, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.4, calcium_mg: 121, sodium_mg: 46, potassium_mg: 155, magnesium_mg: 12 } },
  { name: 'Iogurte natural desnatado',     kcal: 43,  protein: 4.3, carbs: 6.1,  fat: 0.2, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.5, calcium_mg: 138, sodium_mg: 51, potassium_mg: 170, magnesium_mg: 13 } },
  { name: 'Queijo mussarela',              kcal: 300, protein: 21.6, carbs: 2.0, fat: 22.8, fiber: 0.0,
    vitamins: { vitamin_a_mcg: 176, vitamin_b12_mcg: 0.9, calcium_mg: 731, sodium_mg: 460, zinc_mg: 2.9 } },
  { name: 'Queijo cottage',                kcal: 95,  protein: 11.1, carbs: 3.3, fat: 4.3, fiber: 0.0,
    vitamins: { vitamin_b12_mcg: 0.4, calcium_mg: 83, sodium_mg: 364, potassium_mg: 84, zinc_mg: 0.5 } },
  { name: 'Whey protein (concentrado)',    kcal: 382, protein: 80.0, carbs: 8.0, fat: 5.0, fiber: 0.0,
    vitamins: { calcium_mg: 600, sodium_mg: 200, potassium_mg: 500 } },
  { name: 'Queijo ricota',                 kcal: 135, protein: 9.4,  carbs: 3.1, fat: 9.4, fiber: 0.0,
    vitamins: { vitamin_a_mcg: 54, vitamin_b12_mcg: 0.2, calcium_mg: 207, sodium_mg: 84, zinc_mg: 0.5 } },
  { name: 'Requeijão cremoso',             kcal: 255, protein: 8.6,  carbs: 4.0, fat: 22.5, fiber: 0.0,
    vitamins: { vitamin_a_mcg: 140, calcium_mg: 190, sodium_mg: 380, zinc_mg: 0.7 } },

  # Frutas
  { name: 'Banana prata',                  kcal: 98,  protein: 1.3, carbs: 26.0, fat: 0.1, fiber: 2.0,
    vitamins: { vitamin_c_mg: 9, vitamin_b12_mcg: 0, potassium_mg: 376, magnesium_mg: 27, iron_mg: 0.3 } },
  { name: 'Maçã com casca',                kcal: 56,  protein: 0.3, carbs: 15.2, fat: 0.1, fiber: 2.0,
    vitamins: { vitamin_c_mg: 6, potassium_mg: 107, iron_mg: 0.1 } },
  { name: 'Laranja pera',                  kcal: 37,  protein: 1.0, carbs: 8.9,  fat: 0.1, fiber: 2.4,
    vitamins: { vitamin_c_mg: 43, vitamin_a_mcg: 7, calcium_mg: 22, potassium_mg: 178, iron_mg: 0.2 } },
  { name: 'Mamão formosa',                 kcal: 40,  protein: 0.5, carbs: 10.4, fat: 0.1, fiber: 1.8,
    vitamins: { vitamin_c_mg: 61, vitamin_a_mcg: 70, potassium_mg: 204, calcium_mg: 20, iron_mg: 0.2 } },
  { name: 'Morango',                        kcal: 30,  protein: 0.8, carbs: 7.1,  fat: 0.3, fiber: 2.0,
    vitamins: { vitamin_c_mg: 54, potassium_mg: 166, calcium_mg: 17, iron_mg: 0.4 } },
  { name: 'Uva itália',                    kcal: 69,  protein: 0.7, carbs: 17.3, fat: 0.4, fiber: 0.9,
    vitamins: { vitamin_c_mg: 4, potassium_mg: 191, iron_mg: 0.4 } },
  { name: 'Melancia',                      kcal: 33,  protein: 0.7, carbs: 8.1,  fat: 0.2, fiber: 0.5,
    vitamins: { vitamin_c_mg: 8, vitamin_a_mcg: 28, potassium_mg: 112, iron_mg: 0.2 } },
  { name: 'Abacaxi',                       kcal: 48,  protein: 0.9, carbs: 12.3, fat: 0.1, fiber: 1.0,
    vitamins: { vitamin_c_mg: 36, potassium_mg: 109, magnesium_mg: 12, iron_mg: 0.3 } },
  { name: 'Manga espada',                  kcal: 64,  protein: 0.9, carbs: 16.8, fat: 0.2, fiber: 1.6,
    vitamins: { vitamin_c_mg: 30, vitamin_a_mcg: 54, potassium_mg: 156, iron_mg: 0.2 } },
  { name: 'Abacate',                       kcal: 96,  protein: 1.2, carbs: 6.0,  fat: 8.4, fiber: 6.3,
    vitamins: { vitamin_c_mg: 8, vitamin_a_mcg: 7, potassium_mg: 507, magnesium_mg: 29, iron_mg: 0.6 } },

  # Verduras e legumes
  { name: 'Alface',                        kcal: 11,  protein: 1.3, carbs: 1.7,  fat: 0.2, fiber: 1.8,
    vitamins: { vitamin_a_mcg: 166, vitamin_c_mg: 3, calcium_mg: 36, iron_mg: 0.5, potassium_mg: 194 } },
  { name: 'Tomate',                         kcal: 15,  protein: 1.1, carbs: 3.1,  fat: 0.2, fiber: 1.2,
    vitamins: { vitamin_a_mcg: 40, vitamin_c_mg: 21, potassium_mg: 222, calcium_mg: 11, iron_mg: 0.3 } },
  { name: 'Cenoura crua',                  kcal: 34,  protein: 1.3, carbs: 7.7,  fat: 0.2, fiber: 3.2,
    vitamins: { vitamin_a_mcg: 835, vitamin_c_mg: 6, calcium_mg: 30, iron_mg: 0.3, potassium_mg: 320, magnesium_mg: 12 } },
  { name: 'Brócolis cozido',               kcal: 25,  protein: 2.9, carbs: 3.8,  fat: 0.4, fiber: 3.4,
    vitamins: { vitamin_c_mg: 93, vitamin_a_mcg: 31, calcium_mg: 47, iron_mg: 0.7, potassium_mg: 293, magnesium_mg: 21 } },
  { name: 'Espinafre cozido',              kcal: 20,  protein: 2.6, carbs: 2.0,  fat: 0.6, fiber: 2.3,
    vitamins: { vitamin_a_mcg: 469, vitamin_c_mg: 28, calcium_mg: 93, iron_mg: 2.7, potassium_mg: 466, magnesium_mg: 87 } },
  { name: 'Abobrinha cozida',              kcal: 15,  protein: 0.9, carbs: 2.8,  fat: 0.3, fiber: 1.3,
    vitamins: { vitamin_c_mg: 9, vitamin_a_mcg: 10, potassium_mg: 262, calcium_mg: 16, iron_mg: 0.4 } },
  { name: 'Beterraba crua',                kcal: 35,  protein: 1.7, carbs: 8.0,  fat: 0.1, fiber: 2.1,
    vitamins: { vitamin_c_mg: 4, potassium_mg: 325, calcium_mg: 16, iron_mg: 0.8, magnesium_mg: 23 } },
  { name: 'Couve-flor cozida',             kcal: 22,  protein: 2.5, carbs: 3.2,  fat: 0.2, fiber: 2.9,
    vitamins: { vitamin_c_mg: 44, calcium_mg: 22, iron_mg: 0.4, potassium_mg: 176, magnesium_mg: 15 } },
  { name: 'Pepino cru',                    kcal: 10,  protein: 0.6, carbs: 2.1,  fat: 0.1, fiber: 0.8,
    vitamins: { vitamin_c_mg: 3, potassium_mg: 147, calcium_mg: 16, iron_mg: 0.3 } },
  { name: 'Chuchu cozido',                 kcal: 17,  protein: 0.7, carbs: 3.7,  fat: 0.1, fiber: 1.5,
    vitamins: { vitamin_c_mg: 7, potassium_mg: 125, calcium_mg: 20, iron_mg: 0.2 } },
  { name: 'Couve refogada',                kcal: 47,  protein: 4.0, carbs: 4.4,  fat: 2.5, fiber: 4.4,
    vitamins: { vitamin_a_mcg: 386, vitamin_c_mg: 76, calcium_mg: 145, iron_mg: 1.5, potassium_mg: 447, magnesium_mg: 34 } },

  # Tubérculos
  { name: 'Batata inglesa cozida',         kcal: 52,  protein: 1.2, carbs: 12.6, fat: 0.1, fiber: 1.2,
    vitamins: { vitamin_c_mg: 13, potassium_mg: 379, magnesium_mg: 22, iron_mg: 0.3 } },
  { name: 'Mandioca cozida',               kcal: 125, protein: 0.6, carbs: 30.1, fat: 0.3, fiber: 1.9,
    vitamins: { vitamin_c_mg: 20, potassium_mg: 271, calcium_mg: 16, iron_mg: 0.3 } },
  { name: 'Inhame cozido',                 kcal: 116, protein: 1.5, carbs: 27.9, fat: 0.2, fiber: 1.5,
    vitamins: { vitamin_c_mg: 12, potassium_mg: 670, magnesium_mg: 21, iron_mg: 0.5 } },

  # Gorduras e óleos
  { name: 'Azeite de oliva',               kcal: 884, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0,
    vitamins: {} },
  { name: 'Óleo de coco',                  kcal: 862, protein: 0.0, carbs: 0.0, fat: 99.9,  fiber: 0.0,
    vitamins: {} },
  { name: 'Manteiga',                      kcal: 726, protein: 0.4, carbs: 0.0, fat: 83.2,  fiber: 0.0,
    vitamins: { vitamin_a_mcg: 684, vitamin_d_mcg: 1.5, sodium_mg: 643, calcium_mg: 24 } },
  { name: 'Margarina',                     kcal: 718, protein: 0.0, carbs: 0.4, fat: 81.5,  fiber: 0.0,
    vitamins: { sodium_mg: 700, vitamin_a_mcg: 300 } },

  # Oleaginosas e sementes
  { name: 'Amendoim torrado',              kcal: 570, protein: 26.2, carbs: 16.0, fat: 47.6, fiber: 7.7,
    vitamins: { calcium_mg: 54, iron_mg: 2.3, potassium_mg: 658, magnesium_mg: 168, zinc_mg: 3.3 } },
  { name: 'Castanha-do-pará',              kcal: 643, protein: 14.3, carbs: 15.1, fat: 63.5, fiber: 7.9,
    vitamins: { calcium_mg: 160, iron_mg: 2.4, potassium_mg: 597, magnesium_mg: 376, zinc_mg: 4.1, sodium_mg: 3 } },
  { name: 'Amêndoa torrada',               kcal: 581, protein: 18.2, carbs: 21.0, fat: 50.6, fiber: 11.6,
    vitamins: { vitamin_e_mg: 25.6, calcium_mg: 264, iron_mg: 3.7, potassium_mg: 705, magnesium_mg: 270, zinc_mg: 3.1 } },
  { name: 'Pasta de amendoim',             kcal: 590, protein: 24.0, carbs: 20.0, fat: 50.0, fiber: 6.0,
    vitamins: { calcium_mg: 49, iron_mg: 1.9, potassium_mg: 558, magnesium_mg: 154, zinc_mg: 2.9 } },
  { name: 'Chia',                          kcal: 489, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4,
    vitamins: { calcium_mg: 631, iron_mg: 7.7, potassium_mg: 407, magnesium_mg: 335, zinc_mg: 4.6 } },
  { name: 'Linhaça',                       kcal: 534, protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3,
    vitamins: { calcium_mg: 255, iron_mg: 5.7, potassium_mg: 813, magnesium_mg: 392, zinc_mg: 4.3 } },
  { name: 'Quinoa cozida',                 kcal: 120, protein: 4.4,  carbs: 21.3, fat: 1.9,  fiber: 2.8,
    vitamins: { calcium_mg: 17, iron_mg: 1.5, potassium_mg: 172, magnesium_mg: 64, zinc_mg: 1.1 } },

  # Bebidas
  { name: 'Suco de laranja natural',       kcal: 45,  protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.1,
    vitamins: { vitamin_c_mg: 40, potassium_mg: 200, calcium_mg: 11, iron_mg: 0.1 } },
  { name: 'Leite de coco',                 kcal: 196, protein: 2.0, carbs: 2.9,  fat: 21.3, fiber: 0.0,
    vitamins: { potassium_mg: 263, magnesium_mg: 37, iron_mg: 1.6, calcium_mg: 16 } },
  { name: 'Café sem açúcar',               kcal: 2,   protein: 0.3, carbs: 0.0,  fat: 0.0,  fiber: 0.0,
    vitamins: { potassium_mg: 92, magnesium_mg: 8 } },
].freeze

puts "Semeando #{TACO_FOODS.size} alimentos da tabela TACO..."

TACO_FOODS.each do |food_data|
  food = Food.find_or_initialize_by(name: food_data[:name], source: 'taco', account_id: nil)
  food.kcal_per_100g     = food_data[:kcal]
  food.protein_per_100g  = food_data[:protein]
  food.carbs_per_100g    = food_data[:carbs]
  food.fat_per_100g      = food_data[:fat]
  food.fiber_per_100g    = food_data[:fiber]
  food.vitamins_per_100g = food_data.fetch(:vitamins, {}).transform_keys(&:to_s)
  food.save!
end

puts "✅ #{Food.taco.count} alimentos TACO no banco."
