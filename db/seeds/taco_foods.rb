# frozen_string_literal: true
# Tabela Brasileira de Composição de Alimentos (TACO) — UNICAMP
# Valores por 100g do alimento

TACO_FOODS = [
  # Cereais e derivados
  { name: 'Arroz branco cozido',           kcal: 128, protein: 2.5,  carbs: 28.1, fat: 0.2, fiber: 1.6 },
  { name: 'Arroz integral cozido',         kcal: 124, protein: 2.6,  carbs: 25.8, fat: 1.0, fiber: 2.7 },
  { name: 'Aveia em flocos',               kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1 },
  { name: 'Pão francês',                   kcal: 300, protein: 8.0,  carbs: 58.6, fat: 3.1, fiber: 2.3 },
  { name: 'Pão de forma integral',         kcal: 253, protein: 8.2,  carbs: 43.9, fat: 4.8, fiber: 5.9 },
  { name: 'Macarrão cozido',               kcal: 113, protein: 3.7,  carbs: 22.7, fat: 0.5, fiber: 1.3 },
  { name: 'Macarrão integral cozido',      kcal: 116, protein: 4.5,  carbs: 22.1, fat: 0.9, fiber: 3.5 },
  { name: 'Farinha de trigo',              kcal: 360, protein: 9.8,  carbs: 75.1, fat: 1.4, fiber: 2.3 },
  { name: 'Farinha de mandioca torrada',   kcal: 361, protein: 1.5,  carbs: 87.7, fat: 0.3, fiber: 6.4 },
  { name: 'Tapioca (goma hidratada)',      kcal: 62,  protein: 0.1,  carbs: 15.3, fat: 0.0, fiber: 0.1 },
  { name: 'Cuscuz (milho, cozido)',        kcal: 74,  protein: 1.6,  carbs: 15.3, fat: 0.5, fiber: 0.8 },
  { name: 'Batata doce cozida',            kcal: 77,  protein: 1.4,  carbs: 17.6, fat: 0.1, fiber: 2.5 },

  # Leguminosas
  { name: 'Feijão carioca cozido',         kcal: 76,  protein: 4.8,  carbs: 13.6, fat: 0.5, fiber: 8.5 },
  { name: 'Feijão preto cozido',           kcal: 77,  protein: 4.5,  carbs: 14.0, fat: 0.5, fiber: 8.4 },
  { name: 'Lentilha cozida',               kcal: 93,  protein: 6.3,  carbs: 15.6, fat: 0.5, fiber: 3.7 },
  { name: 'Grão-de-bico cozido',           kcal: 164, protein: 8.9,  carbs: 27.4, fat: 2.6, fiber: 6.4 },
  { name: 'Ervilha cozida',                kcal: 74,  protein: 4.8,  carbs: 12.6, fat: 0.4, fiber: 4.7 },

  # Carnes e aves
  { name: 'Frango grelhado (peito sem pele)', kcal: 163, protein: 32.0, carbs: 0.0, fat: 3.2, fiber: 0.0 },
  { name: 'Carne bovina (patinho grelhado)',  kcal: 219, protein: 33.7, carbs: 0.0, fat: 8.9, fiber: 0.0 },
  { name: 'Carne bovina (acém cozido)',       kcal: 236, protein: 28.2, carbs: 0.0, fat: 13.5, fiber: 0.0 },
  { name: 'Filé de tilápia grelhado',         kcal: 96,  protein: 20.8, carbs: 0.0, fat: 1.7, fiber: 0.0 },
  { name: 'Salmão grelhado',                  kcal: 183, protein: 23.8, carbs: 0.0, fat: 9.2, fiber: 0.0 },
  { name: 'Atum em água (enlatado)',           kcal: 119, protein: 26.0, carbs: 0.0, fat: 1.1, fiber: 0.0 },
  { name: 'Ovo de galinha inteiro cozido',     kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0.0 },
  { name: 'Clara de ovo cozida',               kcal: 52,  protein: 10.9, carbs: 0.8, fat: 0.0, fiber: 0.0 },
  { name: 'Linguiça de frango grelhada',       kcal: 197, protein: 15.8, carbs: 2.1, fat: 14.3, fiber: 0.0 },
  { name: 'Frango (coxa sem pele grelhada)',   kcal: 176, protein: 26.3, carbs: 0.0, fat: 7.3, fiber: 0.0 },

  # Laticínios
  { name: 'Leite integral',                kcal: 61,  protein: 3.2, carbs: 4.7,  fat: 3.2, fiber: 0.0 },
  { name: 'Leite desnatado',               kcal: 35,  protein: 3.4, carbs: 5.0,  fat: 0.2, fiber: 0.0 },
  { name: 'Iogurte natural integral',      kcal: 61,  protein: 3.5, carbs: 4.9,  fat: 3.2, fiber: 0.0 },
  { name: 'Iogurte natural desnatado',     kcal: 43,  protein: 4.3, carbs: 6.1,  fat: 0.2, fiber: 0.0 },
  { name: 'Queijo mussarela',              kcal: 300, protein: 21.6, carbs: 2.0, fat: 22.8, fiber: 0.0 },
  { name: 'Queijo cottage',                kcal: 95,  protein: 11.1, carbs: 3.3, fat: 4.3, fiber: 0.0 },
  { name: 'Whey protein (concentrado)',    kcal: 382, protein: 80.0, carbs: 8.0, fat: 5.0, fiber: 0.0 },
  { name: 'Queijo ricota',                 kcal: 135, protein: 9.4,  carbs: 3.1, fat: 9.4, fiber: 0.0 },
  { name: 'Requeijão cremoso',             kcal: 255, protein: 8.6,  carbs: 4.0, fat: 22.5, fiber: 0.0 },

  # Frutas
  { name: 'Banana prata',                  kcal: 98,  protein: 1.3, carbs: 26.0, fat: 0.1, fiber: 2.0 },
  { name: 'Maçã com casca',                kcal: 56,  protein: 0.3, carbs: 15.2, fat: 0.1, fiber: 2.0 },
  { name: 'Laranja pera',                  kcal: 37,  protein: 1.0, carbs: 8.9,  fat: 0.1, fiber: 2.4 },
  { name: 'Mamão formosa',                 kcal: 40,  protein: 0.5, carbs: 10.4, fat: 0.1, fiber: 1.8 },
  { name: 'Morango',                        kcal: 30,  protein: 0.8, carbs: 7.1,  fat: 0.3, fiber: 2.0 },
  { name: 'Uva itália',                    kcal: 69,  protein: 0.7, carbs: 17.3, fat: 0.4, fiber: 0.9 },
  { name: 'Melancia',                      kcal: 33,  protein: 0.7, carbs: 8.1,  fat: 0.2, fiber: 0.5 },
  { name: 'Abacaxi',                       kcal: 48,  protein: 0.9, carbs: 12.3, fat: 0.1, fiber: 1.0 },
  { name: 'Manga espada',                  kcal: 64,  protein: 0.9, carbs: 16.8, fat: 0.2, fiber: 1.6 },
  { name: 'Abacate',                       kcal: 96,  protein: 1.2, carbs: 6.0,  fat: 8.4, fiber: 6.3 },

  # Verduras e legumes
  { name: 'Alface',                        kcal: 11,  protein: 1.3, carbs: 1.7,  fat: 0.2, fiber: 1.8 },
  { name: 'Tomate',                         kcal: 15,  protein: 1.1, carbs: 3.1,  fat: 0.2, fiber: 1.2 },
  { name: 'Cenoura crua',                  kcal: 34,  protein: 1.3, carbs: 7.7,  fat: 0.2, fiber: 3.2 },
  { name: 'Brócolis cozido',               kcal: 25,  protein: 2.9, carbs: 3.8,  fat: 0.4, fiber: 3.4 },
  { name: 'Espinafre cozido',              kcal: 20,  protein: 2.6, carbs: 2.0,  fat: 0.6, fiber: 2.3 },
  { name: 'Abobrinha cozida',              kcal: 15,  protein: 0.9, carbs: 2.8,  fat: 0.3, fiber: 1.3 },
  { name: 'Beterraba crua',                kcal: 35,  protein: 1.7, carbs: 8.0,  fat: 0.1, fiber: 2.1 },
  { name: 'Couve-flor cozida',             kcal: 22,  protein: 2.5, carbs: 3.2,  fat: 0.2, fiber: 2.9 },
  { name: 'Pepino cru',                    kcal: 10,  protein: 0.6, carbs: 2.1,  fat: 0.1, fiber: 0.8 },
  { name: 'Chuchu cozido',                 kcal: 17,  protein: 0.7, carbs: 3.7,  fat: 0.1, fiber: 1.5 },
  { name: 'Couve refogada',                kcal: 47,  protein: 4.0, carbs: 4.4,  fat: 2.5, fiber: 4.4 },

  # Tubérculos
  { name: 'Batata inglesa cozida',         kcal: 52,  protein: 1.2, carbs: 12.6, fat: 0.1, fiber: 1.2 },
  { name: 'Mandioca cozida',               kcal: 125, protein: 0.6, carbs: 30.1, fat: 0.3, fiber: 1.9 },
  { name: 'Inhame cozido',                 kcal: 116, protein: 1.5, carbs: 27.9, fat: 0.2, fiber: 1.5 },

  # Gorduras e óleos
  { name: 'Azeite de oliva',               kcal: 884, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0 },
  { name: 'Óleo de coco',                  kcal: 862, protein: 0.0, carbs: 0.0, fat: 99.9,  fiber: 0.0 },
  { name: 'Manteiga',                      kcal: 726, protein: 0.4, carbs: 0.0, fat: 83.2,  fiber: 0.0 },
  { name: 'Margarina',                     kcal: 718, protein: 0.0, carbs: 0.4, fat: 81.5,  fiber: 0.0 },

  # Oleaginosas e sementes
  { name: 'Amendoim torrado',              kcal: 570, protein: 26.2, carbs: 16.0, fat: 47.6, fiber: 7.7 },
  { name: 'Castanha-do-pará',              kcal: 643, protein: 14.3, carbs: 15.1, fat: 63.5, fiber: 7.9 },
  { name: 'Amêndoa torrada',               kcal: 581, protein: 18.2, carbs: 21.0, fat: 50.6, fiber: 11.6 },
  { name: 'Pasta de amendoim',             kcal: 590, protein: 24.0, carbs: 20.0, fat: 50.0, fiber: 6.0 },
  { name: 'Chia',                          kcal: 489, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4 },
  { name: 'Linhaça',                       kcal: 534, protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3 },
  { name: 'Quinoa cozida',                 kcal: 120, protein: 4.4,  carbs: 21.3, fat: 1.9,  fiber: 2.8 },

  # Bebidas
  { name: 'Suco de laranja natural',       kcal: 45,  protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.1 },
  { name: 'Leite de coco',                 kcal: 196, protein: 2.0, carbs: 2.9,  fat: 21.3, fiber: 0.0 },
  { name: 'Café sem açúcar',               kcal: 2,   protein: 0.3, carbs: 0.0,  fat: 0.0,  fiber: 0.0 },
].freeze

puts "Semeando #{TACO_FOODS.size} alimentos da tabela TACO..."

TACO_FOODS.each do |food_data|
  Food.find_or_create_by(name: food_data[:name], source: 'taco', account_id: nil) do |f|
    f.kcal_per_100g    = food_data[:kcal]
    f.protein_per_100g = food_data[:protein]
    f.carbs_per_100g   = food_data[:carbs]
    f.fat_per_100g     = food_data[:fat]
    f.fiber_per_100g   = food_data[:fiber]
  end
end

puts "✅ #{Food.taco.count} alimentos TACO no banco."
