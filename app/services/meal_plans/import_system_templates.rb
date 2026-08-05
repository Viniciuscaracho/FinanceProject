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
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Aveia em flocos', qty: 60 }, { name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Banana prata', qty: 120 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz integral cozido', qty: 150 }, { name: 'Feijão carioca cozido', qty: 120 }, { name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Espinafre cozido', qty: 80 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Castanha-do-pará', qty: 30 }, { name: 'Maçã', qty: 150 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Tomate cru', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Dia Tipo B', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Pão de forma integral', qty: 60 }, { name: 'Queijo cottage', qty: 80 }, { name: 'Tomate cru', qty: 100 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 150 }, { name: 'Grão-de-bico cozido', qty: 150 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 15 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Morango', qty: 100 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 200 }, { name: 'Brócolis cozido', qty: 150 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
        ]
      },

      # ── Esportes ────────────────────────────────────────────────────────────

      {
        title: 'Corrida — Resistência e Endurance',
        description: 'Protocolo para corredores e atletas de endurance. ~2400kcal, 60% carbs, alto carboidrato complexo para sustentar volume de treino. Baseado nas diretrizes SBME/ISSN para esportes de resistência.',
        template_category: 'corrida',
        target_kcal: 2400, target_protein_g: 120, target_carbs_g: 360, target_fat_g: 53, target_fiber_g: 35,
        days: [
          { label: 'Dia de Corrida Longa', meals: [
            { name: 'Café da manhã',   time: '06:30', foods: [{ name: 'Aveia em flocos', qty: 80 }, { name: 'Banana prata', qty: 150 }, { name: 'Mel', qty: 15 }, { name: 'Iogurte natural desnatado', qty: 170 }] },
            { name: 'Pré-corrida',     time: '08:30', foods: [{ name: 'Batata doce cozida', qty: 200 }, { name: 'Mel', qty: 15 }] },
            { name: 'Pós-corrida',     time: '11:30', foods: [{ name: 'Arroz branco cozido', qty: 200 }, { name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Feijão carioca cozido', qty: 80 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '15:30', foods: [{ name: 'Banana prata', qty: 120 }, { name: 'Pasta de amendoim integral', qty: 30 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Macarrão integral cozido', qty: 200 }, { name: 'Atum em água (enlatado)', qty: 120 }, { name: 'Tomate cru', qty: 80 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Dia de Recuperação', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Aveia em flocos', qty: 60 }, { name: 'Iogurte natural integral', qty: 170 }, { name: 'Morango', qty: 150 }, { name: 'Semente de chia', qty: 15 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz integral cozido', qty: 150 }, { name: 'Salmão grelhado', qty: 180 }, { name: 'Brócolis cozido', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:30', foods: [{ name: 'Queijo cottage', qty: 100 }, { name: 'Maçã', qty: 150 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Frango grelhado (peito sem pele)', qty: 180 }, { name: 'Batata inglesa cozida', qty: 200 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
        ]
      },

      {
        title: 'CrossFit — Alta Intensidade',
        description: 'Protocolo para CrossFit e HIIT. ~2600kcal, 40% carbs / 30% prot / 30% fat. Ênfase em proteína de alto valor biológico e carboidratos de baixo IG no pré-treino. Referência: ISSN Position Stand on Protein e CrossFit Nutrition.',
        template_category: 'crossfit',
        target_kcal: 2600, target_protein_g: 195, target_carbs_g: 260, target_fat_g: 87, target_fiber_g: 30,
        days: [
          { label: 'Dia de WOD', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Ovo de galinha inteiro cozido', qty: 200 }, { name: 'Aveia em flocos', qty: 60 }, { name: 'Banana prata', qty: 120 }] },
            { name: 'Pré-treino',      time: '09:30', foods: [{ name: 'Batata doce cozida', qty: 150 }, { name: 'Whey protein (concentrado)', qty: 30 }] },
            { name: 'Pós-treino',      time: '12:00', foods: [{ name: 'Arroz branco cozido', qty: 150 }, { name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Brócolis cozido', qty: 100 }] },
            { name: 'Lanche da tarde', time: '15:30', foods: [{ name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Castanha-do-pará', qty: 30 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Carne bovina (patinho grelhado)', qty: 200 }, { name: 'Arroz integral cozido', qty: 100 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Dia de Descanso', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Clara de ovo cozida', qty: 200 }, { name: 'Ovo de galinha inteiro cozido', qty: 100 }, { name: 'Pão de forma integral', qty: 60 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Arroz integral cozido', qty: 100 }, { name: 'Feijão preto cozido', qty: 80 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Queijo cottage', qty: 120 }, { name: 'Amendoim torrado sem sal', qty: 30 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Filé de tilápia grelhado', qty: 200 }, { name: 'Batata doce cozida', qty: 120 }, { name: 'Brócolis cozido', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
        ]
      },

      {
        title: 'Futebol — Esportes Coletivos',
        description: 'Protocolo para futebol, vôlei, basquete e esportes intermitentes. ~2800kcal, 55% carbs. Estratégia de periodização nutricional: mais carboidrato nos dias de jogo, reequilíbrio no treino. Baseado em diretrizes FIFA/UEFA e SBME.',
        template_category: 'esportes_coletivos',
        target_kcal: 2800, target_protein_g: 140, target_carbs_g: 385, target_fat_g: 78, target_fiber_g: 32,
        days: [
          { label: 'Dia de Jogo', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Aveia em flocos', qty: 80 }, { name: 'Banana prata', qty: 150 }, { name: 'Mel', qty: 20 }, { name: 'Iogurte natural integral', qty: 170 }] },
            { name: 'Pré-jogo',        time: '10:00', foods: [{ name: 'Arroz branco cozido', qty: 200 }, { name: 'Frango grelhado (peito sem pele)', qty: 150 }, { name: 'Cenoura crua', qty: 80 }] },
            { name: 'Pós-jogo',        time: '14:00', foods: [{ name: 'Arroz branco cozido', qty: 200 }, { name: 'Feijão carioca cozido', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '17:00', foods: [{ name: 'Banana prata', qty: 150 }, { name: 'Pasta de amendoim integral', qty: 30 }, { name: 'Pão de forma integral', qty: 60 }] },
            { name: 'Jantar',          time: '20:30', foods: [{ name: 'Macarrão cozido', qty: 200 }, { name: 'Filé de tilápia grelhado', qty: 180 }, { name: 'Brócolis cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Dia de Treino', meals: [
            { name: 'Café da manhã',   time: '08:00', foods: [{ name: 'Aveia em flocos', qty: 70 }, { name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Banana prata', qty: 120 }] },
            { name: 'Almoço',          time: '12:30', foods: [{ name: 'Arroz branco cozido', qty: 180 }, { name: 'Feijão carioca cozido', qty: 100 }, { name: 'Carne bovina (patinho grelhado)', qty: 180 }, { name: 'Tomate cru', qty: 80 }, { name: 'Alface crespa crua', qty: 50 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Iogurte natural desnatado', qty: 170 }, { name: 'Maçã', qty: 150 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Frango grelhado (peito sem pele)', qty: 180 }, { name: 'Batata doce cozida', qty: 180 }, { name: 'Abobrinha cozida', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Dia de Recuperação', meals: [
            { name: 'Café da manhã',   time: '08:30', foods: [{ name: 'Granola tradicional', qty: 60 }, { name: 'Iogurte natural integral', qty: 170 }, { name: 'Morango', qty: 100 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz integral cozido', qty: 150 }, { name: 'Salmão grelhado', qty: 180 }, { name: 'Brócolis cozido', qty: 150 }, { name: 'Cenoura crua', qty: 80 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:30', foods: [{ name: 'Queijo cottage', qty: 100 }, { name: 'Castanha-do-pará', qty: 30 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Filé de tilápia grelhado', qty: 200 }, { name: 'Mandioca cozida', qty: 150 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
        ]
      },

      {
        title: 'Natação — Alto Volume',
        description: 'Protocolo para nadadores e triatletas. ~3000kcal, 55% carbs, alta densidade energética para sustentar treinos de 2x/dia. Atenção especial ao ferro (espinafre + carne), vitamina D (salmão) e omega-3 para redução de inflamação. Referência: IOC Consensus e Fina Nutrition Guidelines.',
        template_category: 'natacao',
        target_kcal: 3000, target_protein_g: 150, target_carbs_g: 413, target_fat_g: 83, target_fiber_g: 35,
        days: [
          { label: 'Dia de Treino Intenso', meals: [
            { name: 'Café da manhã',   time: '06:00', foods: [{ name: 'Aveia em flocos', qty: 100 }, { name: 'Banana prata', qty: 150 }, { name: 'Mel', qty: 20 }, { name: 'Leite integral', qty: 300 }] },
            { name: 'Lanche da manhã', time: '09:30', foods: [{ name: 'Tapioca (goma hidratada)', qty: 150 }, { name: 'Queijo cottage', qty: 100 }, { name: 'Mel', qty: 15 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 250 }, { name: 'Feijão carioca cozido', qty: 120 }, { name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Cenoura crua', qty: 80 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Banana prata', qty: 150 }, { name: 'Amendoim torrado sem sal', qty: 40 }, { name: 'Aveia em flocos', qty: 40 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Salmão grelhado', qty: 180 }, { name: 'Mandioca cozida', qty: 200 }, { name: 'Espinafre cozido', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Dia de Volume Moderado', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Aveia em flocos', qty: 80 }, { name: 'Ovo de galinha inteiro cozido', qty: 150 }, { name: 'Mamão papaia', qty: 200 }, { name: 'Semente de chia', qty: 15 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz integral cozido', qty: 180 }, { name: 'Grão-de-bico cozido', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 180 }, { name: 'Brócolis cozido', qty: 120 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Lanche da tarde', time: '16:30', foods: [{ name: 'Iogurte natural integral', qty: 170 }, { name: 'Banana prata', qty: 120 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Atum em água (enlatado)', qty: 150 }, { name: 'Macarrão integral cozido', qty: 180 }, { name: 'Tomate cru', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 15 }] },
          ]},
        ]
      },

      {
        title: 'Artes Marciais — Controle de Peso',
        description: 'Protocolo para lutadores (MMA, jiu-jitsu, muay thai, judô). Dois cenários: fora de corte (~2200kcal, 35% prot) e em corte de peso (~1800kcal, alta proteína para preservar massa). Baseado em diretrizes NSCA e SBME para esportes de combate.',
        template_category: 'artes_marciais',
        target_kcal: 2200, target_protein_g: 175, target_carbs_g: 225, target_fat_g: 61, target_fiber_g: 28,
        days: [
          { label: 'Fora de Corte', meals: [
            { name: 'Café da manhã',   time: '07:30', foods: [{ name: 'Aveia em flocos', qty: 60 }, { name: 'Clara de ovo cozida', qty: 200 }, { name: 'Ovo de galinha inteiro cozido', qty: 100 }, { name: 'Banana prata', qty: 100 }] },
            { name: 'Pré-treino',      time: '10:00', foods: [{ name: 'Batata doce cozida', qty: 150 }, { name: 'Frango grelhado (peito sem pele)', qty: 150 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 150 }, { name: 'Feijão preto cozido', qty: 80 }, { name: 'Carne bovina (patinho grelhado)', qty: 180 }, { name: 'Alface crespa crua', qty: 60 }, { name: 'Tomate cru', qty: 80 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
            { name: 'Pós-treino',      time: '17:00', foods: [{ name: 'Whey protein (concentrado)', qty: 40 }, { name: 'Banana prata', qty: 120 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Batata doce cozida', qty: 120 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 10 }] },
          ]},
          { label: 'Em Corte de Peso', meals: [
            { name: 'Café da manhã',   time: '07:00', foods: [{ name: 'Clara de ovo cozida', qty: 200 }, { name: 'Ovo de galinha inteiro cozido', qty: 50 }, { name: 'Aveia em flocos', qty: 40 }] },
            { name: 'Pré-treino',      time: '10:00', foods: [{ name: 'Batata doce cozida', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 120 }] },
            { name: 'Almoço',          time: '13:00', foods: [{ name: 'Arroz branco cozido', qty: 100 }, { name: 'Frango grelhado (peito sem pele)', qty: 200 }, { name: 'Brócolis cozido', qty: 150 }, { name: 'Espinafre cozido', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 5 }] },
            { name: 'Lanche da tarde', time: '16:00', foods: [{ name: 'Queijo cottage', qty: 150 }, { name: 'Cenoura crua', qty: 100 }] },
            { name: 'Jantar',          time: '20:00', foods: [{ name: 'Filé de tilápia grelhado', qty: 200 }, { name: 'Abobrinha cozida', qty: 150 }, { name: 'Tomate cru', qty: 100 }, { name: 'Azeite de oliva extra virgem', qty: 5 }] },
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
            is_template:       true,
            target_kcal:       tpl[:target_kcal]      || 0,
            target_protein_g:  tpl[:target_protein_g] || 0,
            target_carbs_g:    tpl[:target_carbs_g]   || 0,
            target_fat_g:      tpl[:target_fat_g]     || 0,
            target_fiber_g:    tpl[:target_fiber_g]   || 0
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
