# frozen_string_literal: true

# Cria 8 novos contatos com coaching_profile e dados analíticos completos
# para a conta 55 (viniciuscaracho77@gmail.com).
# Cada atleta representa um perfil narrativo distinto — útil para validar
# gráficos, alertas e comparativos no frontend analytics.
class SeedMoreCoachingContacts < ActiveRecord::Migration[7.0]
  ACCOUNT_ID = 55

  ATHLETES = [
    {
      first_name: 'Fernanda',   last_name: 'Rodrigues',
      birth_date: '1992-03-14', goal: 'Perder gordura e ganhar condicionamento para corrida',
      limitations: 'Tendinite no joelho direito — evitar impacto excessivo',
      narrative: :perda_gordura_runner,
    },
    {
      first_name: 'Ricardo',    last_name: 'Alves',
      birth_date: '1985-07-22', goal: 'Ganho de massa muscular e força',
      limitations: 'Nenhuma',
      narrative: :ganho_massa_consistente,
    },
    {
      first_name: 'Camila',     last_name: 'Souza',
      birth_date: '1998-11-05', goal: 'Emagrecimento e melhora da autoestima',
      limitations: 'Ansiedade — evitar treinos muito intensos no início',
      narrative: :emagrecimento_ansioso,
    },
    {
      first_name: 'Bruno',      last_name: 'Ferreira',
      birth_date: '1990-04-30', goal: 'Melhora do desempenho no futebol amador',
      limitations: 'Nenhuma',
      narrative: :atleta_esportivo_oscilante,
    },
    {
      first_name: 'Patrícia',   last_name: 'Lima',
      birth_date: '1978-09-18', goal: 'Manutenção da saúde e qualidade de vida',
      limitations: 'Hipertensão controlada — monitorar FC durante treino',
      narrative: :manutencao_saude_senior,
    },
    {
      first_name: 'Gustavo',    last_name: 'Mendes',
      birth_date: '2000-01-25', goal: 'Definição muscular e estética',
      limitations: 'Nenhuma',
      narrative: :definicao_jovem_inconsistente,
    },
    {
      first_name: 'Juliana',    last_name: 'Costa',
      birth_date: '1995-06-12', goal: 'Retomar atividade física após gravidez',
      limitations: 'Diástase abdominal leve — evitar abdominais tradicionais',
      narrative: :retorno_pos_parto,
    },
    {
      first_name: 'Marcos',     last_name: 'Oliveira',
      birth_date: '1988-12-03', goal: 'Redução de estresse e melhora do sono via exercício',
      limitations: 'Lombalgia crônica — priorizar core e mobilidade',
      narrative: :estresse_alto_sono_ruim,
    },
  ].freeze

  def up
    ActsAsTenant.without_tenant do
      account = Account.find(ACCOUNT_ID)

      ATHLETES.each do |athlete|
        contact = create_contact!(account, athlete)
        profile = create_profile!(account, contact, athlete)
        create_assessments!(account, contact, athlete[:narrative])
        create_timeline_events!(account, contact, athlete[:narrative])

        say "  ✓ #{athlete[:first_name]} #{athlete[:last_name]} (#{athlete[:narrative]}) → contact #{contact.id}"
      end
    end
  end

  def down
    ActsAsTenant.without_tenant do
      names = ATHLETES.map { |a| a[:first_name] }
      Contact.where(account_id: ACCOUNT_ID, first_name: names).each do |c|
        CoachingProfile.where(contact_id: c.id).delete_all
        execute "DELETE FROM coaching_assessments WHERE contact_id = #{c.id} AND account_id = #{ACCOUNT_ID}"
        execute "DELETE FROM timeline_events WHERE contact_id = #{c.id} AND account_id = #{ACCOUNT_ID} AND source = 'poc_seed'"
        c.destroy
      end
    end
  end

  private

  # ── Criação de registros ──────────────────────────────────────────────────

  def create_contact!(account, attrs)
    Contact.create!(
      account:         account,
      first_name:      attrs[:first_name],
      last_name:       attrs[:last_name],
      birth_date:      attrs[:birth_date],
      contact_type_cd: 0,
      person_type_cd:  0
    )
  end

  def create_profile!(account, contact, attrs)
    CoachingProfile.create!(
      account:    account,
      contact:    contact,
      goal:       attrs[:goal],
      limitations: attrs[:limitations],
      last_feedback_at: Time.current
    )
  end

  def create_assessments!(account, contact, narrative)
    snaps(narrative).each do |snap|
      execute <<~SQL
        INSERT INTO coaching_assessments (
          account_id, contact_id,
          weight_kg, body_fat_pct, muscle_mass_kg, visceral_fat_index,
          waist_cm, hip_cm, arm_cm, thigh_cm,
          resting_hr_bpm,
          push_up_reps, squat_reps, plank_seconds,
          energy_score, sleep_score, stress_score, motivation_score,
          assessed_on, assessment_type, notes,
          created_at, updated_at
        ) VALUES (
          #{account.id}, #{contact.id},
          #{snap[:weight]}, #{snap[:fat]}, #{snap[:muscle]}, #{snap[:visceral]},
          #{snap[:waist]}, #{snap[:hip]}, #{snap[:arm]}, #{snap[:thigh]},
          #{snap[:hr]},
          #{snap[:pushup]}, #{snap[:squat]}, #{snap[:plank]},
          #{snap[:energy]}, #{snap[:sleep]}, #{snap[:stress]}, #{snap[:motivation]},
          '#{snap[:date]}', '#{snap[:type]}', '#{snap[:note]} [POC]',
          NOW(), NOW()
        )
      SQL
    end
  end

  def create_timeline_events!(account, contact, narrative)
    weeks(narrative).each do |w|
      execute <<~SQL
        INSERT INTO timeline_events (
          account_id, contact_id, source,
          sono, carga,
          sono_score, carga_score, humor_score,
          observacao, created_at, updated_at
        ) VALUES (
          #{account.id}, #{contact.id}, 'poc_seed',
          '#{w[:sono_text]}', '#{w[:carga_text]}',
          #{w[:sono_score]}, #{w[:carga_score]}, #{w[:humor]},
          '#{w[:obs]}',
          '#{w[:date]}', '#{w[:date]}'
        )
      SQL
    end
  end

  # ── Dados por narrativa ───────────────────────────────────────────────────

  def snaps(narrative)
    SNAPS[narrative] || []
  end

  def weeks(narrative)
    WEEKS[narrative] || []
  end

  # ── Avaliações periódicas ─────────────────────────────────────────────────

  SNAPS = {

    # Fernanda — perdeu gordura, melhorou resistência, joelho estabilizou
    perda_gordura_runner: [
      { date: '2026-02-01', type: 'initial',   weight: 71.0, fat: 30.0, muscle: 44.5, visceral: 9.0, waist: 82.0, hip: 100.0, arm: 27.0, thigh: 57.0, hr: 76, pushup: 8,  squat: 14, plank: 22.0, energy: 6, sleep: 6, stress: 6, motivation: 8, note: 'Início — muito motivada, joelho sensível' },
      { date: '2026-03-01', type: 'monthly',   weight: 69.5, fat: 28.2, muscle: 45.2, visceral: 8.5, waist: 80.0, hip: 98.5,  arm: 27.5, thigh: 56.0, hr: 74, pushup: 10, squat: 17, plank: 28.0, energy: 7, sleep: 7, stress: 5, motivation: 8, note: '1 mês — ótima aderência, joelho ok' },
      { date: '2026-04-01', type: 'monthly',   weight: 67.8, fat: 26.0, muscle: 46.0, visceral: 7.8, waist: 78.0, hip: 96.5,  arm: 28.0, thigh: 55.0, hr: 71, pushup: 13, squat: 20, plank: 36.0, energy: 7, sleep: 7, stress: 5, motivation: 9, note: '2 meses — começou a correr 5 km sem dor' },
      { date: '2026-05-01', type: 'monthly',   weight: 66.2, fat: 24.0, muscle: 47.0, visceral: 7.0, waist: 76.0, hip: 94.5,  arm: 28.5, thigh: 54.0, hr: 68, pushup: 16, squat: 23, plank: 45.0, energy: 8, sleep: 8, stress: 4, motivation: 9, note: '3 meses — meta de 10 km no próximo mês' },
      { date: '2026-06-01', type: 'monthly',   weight: 64.9, fat: 22.2, muscle: 48.0, visceral: 6.2, waist: 74.0, hip: 92.5,  arm: 29.0, thigh: 53.0, hr: 65, pushup: 19, squat: 26, plank: 54.0, energy: 9, sleep: 8, stress: 3, motivation: 10, note: 'Completou corrida de 10 km — recorde pessoal' },
      { date: '2026-07-01', type: 'quarterly', weight: 63.8, fat: 20.8, muscle: 48.8, visceral: 5.8, waist: 72.5, hip: 91.0,  arm: 29.5, thigh: 52.5, hr: 63, pushup: 21, squat: 28, plank: 60.0, energy: 9, sleep: 9, stress: 3, motivation: 10, note: 'Trimestral — transformação completa' },
    ],

    # Ricardo — ganho de massa puro, força crescente e consistente
    ganho_massa_consistente: [
      { date: '2026-01-05', type: 'initial',   weight: 72.0, fat: 15.0, muscle: 56.5, visceral: 5.0, waist: 78.0, hip: 90.0, arm: 31.0, thigh: 52.0, hr: 62, pushup: 28, squat: 35, plank: 65.0, energy: 7, sleep: 7, stress: 4, motivation: 9, note: 'Já treinado, quer massa' },
      { date: '2026-02-05', type: 'monthly',   weight: 73.5, fat: 14.8, muscle: 58.0, visceral: 5.0, waist: 78.5, hip: 90.5, arm: 32.0, thigh: 53.0, hr: 61, pushup: 32, squat: 39, plank: 70.0, energy: 8, sleep: 7, stress: 4, motivation: 9, note: 'Fase de volume — comendo mais, ótimo' },
      { date: '2026-03-05', type: 'monthly',   weight: 75.0, fat: 14.5, muscle: 59.8, visceral: 5.0, waist: 79.0, hip: 91.0, arm: 33.0, thigh: 54.0, hr: 60, pushup: 36, squat: 43, plank: 78.0, energy: 8, sleep: 8, stress: 3, motivation: 10, note: '2 meses — ganho clean, gordura estável' },
      { date: '2026-04-05', type: 'monthly',   weight: 76.5, fat: 14.2, muscle: 61.5, visceral: 5.0, waist: 79.5, hip: 91.5, arm: 34.0, thigh: 55.0, hr: 59, pushup: 40, squat: 47, plank: 85.0, energy: 9, sleep: 8, stress: 3, motivation: 10, note: '3 meses — force records toda semana' },
      { date: '2026-05-05', type: 'monthly',   weight: 77.8, fat: 14.0, muscle: 63.0, visceral: 5.0, waist: 80.0, hip: 92.0, arm: 35.0, thigh: 56.0, hr: 58, pushup: 44, squat: 50, plank: 90.0, energy: 9, sleep: 9, stress: 2, motivation: 10, note: 'Entrando em cutting a pedido do atleta' },
      { date: '2026-06-05', type: 'quarterly', weight: 76.0, fat: 12.5, muscle: 63.5, visceral: 4.5, waist: 78.0, hip: 90.5, arm: 35.5, thigh: 55.5, hr: 57, pushup: 46, squat: 52, plank: 95.0, energy: 9, sleep: 9, stress: 2, motivation: 10, note: 'Trimestral — melhor composição da vida' },
    ],

    # Camila — evolução positiva mas lenta, ansiedade impacta treino
    emagrecimento_ansioso: [
      { date: '2026-02-10', type: 'initial',   weight: 84.0, fat: 36.0, muscle: 48.0, visceral: 12.0, waist: 95.0, hip: 110.0, arm: 30.0, thigh: 60.0, hr: 82, pushup: 5,  squat: 10, plank: 15.0, energy: 4, sleep: 5, stress: 9, motivation: 7, note: 'Muito ansiosa, primeira vez numa academia' },
      { date: '2026-03-10', type: 'monthly',   weight: 83.0, fat: 35.0, muscle: 48.5, visceral: 11.5, waist: 94.0, hip: 109.0, arm: 30.2, thigh: 59.5, hr: 80, pushup: 6,  squat: 12, plank: 18.0, energy: 5, sleep: 5, stress: 8, motivation: 7, note: '1 mês — leve melhora, ansiedade persiste' },
      { date: '2026-04-10', type: 'monthly',   weight: 81.5, fat: 33.5, muscle: 49.2, visceral: 11.0, waist: 92.5, hip: 107.5, arm: 30.5, thigh: 58.5, hr: 78, pushup: 8,  squat: 14, plank: 22.0, energy: 6, sleep: 6, stress: 7, motivation: 8, note: '2 meses — mais à vontade, progresso visível' },
      { date: '2026-05-10', type: 'monthly',   weight: 80.2, fat: 32.0, muscle: 50.0, visceral: 10.4, waist: 91.0, hip: 106.0, arm: 31.0, thigh: 57.5, hr: 76, pushup: 10, squat: 16, plank: 27.0, energy: 6, sleep: 6, stress: 7, motivation: 8, note: '3 meses — começou terapia, ajudando muito' },
      { date: '2026-06-10', type: 'monthly',   weight: 78.8, fat: 30.2, muscle: 51.0, visceral: 9.8,  waist: 89.5, hip: 104.5, arm: 31.5, thigh: 56.5, hr: 74, pushup: 12, squat: 18, plank: 33.0, energy: 7, sleep: 7, stress: 6, motivation: 9, note: '4 meses — ótima sinergia terapia + treino' },
      { date: '2026-07-10', type: 'quarterly', weight: 77.5, fat: 28.5, muscle: 52.0, visceral: 9.0,  waist: 88.0, hip: 103.0, arm: 32.0, thigh: 55.5, hr: 72, pushup: 14, squat: 20, plank: 38.0, energy: 8, sleep: 7, stress: 5, motivation: 9, note: 'Trimestral — mais confiante, mantém terapia' },
    ],

    # Bruno — bom condicionamento mas irregular, piora quando tem campeonatos
    atleta_esportivo_oscilante: [
      { date: '2026-01-20', type: 'initial',   weight: 78.0, fat: 18.0, muscle: 59.0, visceral: 6.0, waist: 82.0, hip: 94.0, arm: 32.0, thigh: 55.0, hr: 64, pushup: 30, squat: 38, plank: 70.0, energy: 7, sleep: 7, stress: 5, motivation: 8, note: 'Bom pré-temporada, quer performance' },
      { date: '2026-02-20', type: 'monthly',   weight: 77.5, fat: 17.2, muscle: 59.8, visceral: 5.8, waist: 81.0, hip: 93.5, arm: 32.5, thigh: 55.0, hr: 62, pushup: 33, squat: 41, plank: 76.0, energy: 8, sleep: 8, stress: 4, motivation: 9, note: 'Pré-temporada — ótimo, sem campeonato' },
      { date: '2026-03-20', type: 'monthly',   weight: 79.0, fat: 19.5, muscle: 58.5, visceral: 6.5, waist: 83.5, hip: 95.0, arm: 32.0, thigh: 56.0, hr: 67, pushup: 29, squat: 36, plank: 65.0, energy: 5, sleep: 5, stress: 8, motivation: 6, note: 'Campeonato — treinos irregulares, bebeu mais' },
      { date: '2026-04-20', type: 'monthly',   weight: 77.8, fat: 17.5, muscle: 59.5, visceral: 5.9, waist: 81.5, hip: 93.8, arm: 32.3, thigh: 55.2, hr: 63, pushup: 32, squat: 40, plank: 73.0, energy: 8, sleep: 8, stress: 4, motivation: 9, note: 'Pós-campeonato — voltou forte' },
      { date: '2026-05-20', type: 'monthly',   weight: 80.0, fat: 20.0, muscle: 58.0, visceral: 7.0, waist: 84.0, hip: 95.5, arm: 31.8, thigh: 56.5, hr: 68, pushup: 27, squat: 34, plank: 62.0, energy: 4, sleep: 5, stress: 9, motivation: 5, note: 'Torneio estadual — piorou tudo de novo' },
      { date: '2026-06-20', type: 'quarterly', weight: 78.0, fat: 17.8, muscle: 59.2, visceral: 6.0, waist: 82.0, hip: 94.0, arm: 32.2, thigh: 55.0, hr: 64, pushup: 31, squat: 39, plank: 72.0, energy: 7, sleep: 7, stress: 5, motivation: 8, note: 'Trimestral — padrão oscilante confirmado' },
    ],

    # Patrícia — manutenção sólida, hipertensão controlada, progresso modesto
    manutencao_saude_senior: [
      { date: '2026-01-08', type: 'initial',   weight: 68.0, fat: 33.0, muscle: 40.5, visceral: 10.0, waist: 88.0, hip: 102.0, arm: 27.0, thigh: 53.0, hr: 78, pushup: 6,  squat: 10, plank: 18.0, energy: 6, sleep: 7, stress: 5, motivation: 7, note: 'Hipertensa, nunca treinou sistematicamente' },
      { date: '2026-02-08', type: 'monthly',   weight: 67.5, fat: 32.5, muscle: 41.0, visceral: 9.8,  waist: 87.5, hip: 101.5, arm: 27.2, thigh: 52.8, hr: 76, pushup: 7,  squat: 12, plank: 21.0, energy: 6, sleep: 7, stress: 5, motivation: 7, note: '1 mês — FC controlada no treino, boa adesão' },
      { date: '2026-03-08', type: 'monthly',   weight: 67.0, fat: 32.0, muscle: 41.5, visceral: 9.5,  waist: 87.0, hip: 101.0, arm: 27.5, thigh: 52.5, hr: 74, pushup: 8,  squat: 13, plank: 24.0, energy: 7, sleep: 7, stress: 4, motivation: 7, note: '2 meses — PA melhorou, médico aprovou' },
      { date: '2026-04-08', type: 'monthly',   weight: 66.8, fat: 31.5, muscle: 42.0, visceral: 9.2,  waist: 86.5, hip: 100.5, arm: 27.8, thigh: 52.2, hr: 72, pushup: 9,  squat: 14, plank: 27.0, energy: 7, sleep: 8, stress: 4, motivation: 8, note: '3 meses — dorme melhor, mais disposta' },
      { date: '2026-05-08', type: 'monthly',   weight: 66.5, fat: 31.0, muscle: 42.5, visceral: 9.0,  waist: 86.0, hip: 100.0, arm: 28.0, thigh: 52.0, hr: 71, pushup: 10, squat: 15, plank: 30.0, energy: 7, sleep: 8, stress: 4, motivation: 8, note: '4 meses — estabilização saudável' },
      { date: '2026-06-08', type: 'quarterly', weight: 66.2, fat: 30.5, muscle: 43.0, visceral: 8.8,  waist: 85.5, hip: 99.5,  arm: 28.2, thigh: 51.8, hr: 70, pushup: 11, squat: 16, plank: 33.0, energy: 8, sleep: 8, stress: 3, motivation: 8, note: 'Trimestral — saúde em dia, PA normalizada' },
    ],

    # Gustavo — bons resultados mas frequência irregular, pula treinos
    definicao_jovem_inconsistente: [
      { date: '2026-03-01', type: 'initial',   weight: 75.0, fat: 19.0, muscle: 57.0, visceral: 6.0, waist: 80.0, hip: 92.0, arm: 32.0, thigh: 53.0, hr: 66, pushup: 25, squat: 32, plank: 55.0, energy: 8, sleep: 6, stress: 5, motivation: 9, note: 'Quer definição, já tem base muscular' },
      { date: '2026-04-01', type: 'monthly',   weight: 73.8, fat: 17.5, muscle: 57.5, visceral: 5.7, waist: 78.5, hip: 91.0, arm: 32.3, thigh: 52.5, hr: 64, pushup: 28, squat: 35, plank: 60.0, energy: 7, sleep: 6, stress: 6, motivation: 8, note: '1 mês — ok, mas faltou 4 treinos' },
      { date: '2026-05-01', type: 'monthly',   weight: 73.0, fat: 17.0, muscle: 57.8, visceral: 5.5, waist: 78.0, hip: 90.5, arm: 32.5, thigh: 52.2, hr: 63, pushup: 29, squat: 36, plank: 62.0, energy: 7, sleep: 6, stress: 6, motivation: 7, note: '2 meses — faltou viagem, perdeu 2 semanas' },
      { date: '2026-06-01', type: 'monthly',   weight: 74.0, fat: 18.0, muscle: 57.2, visceral: 5.8, waist: 79.0, hip: 91.5, arm: 32.0, thigh: 53.0, hr: 65, pushup: 26, squat: 33, plank: 57.0, energy: 6, sleep: 5, stress: 7, motivation: 6, note: '3 meses — balada toda semana, regrediu' },
      { date: '2026-07-01', type: 'monthly',   weight: 72.5, fat: 16.5, muscle: 58.0, visceral: 5.3, waist: 77.5, hip: 90.0, arm: 32.8, thigh: 51.8, hr: 63, pushup: 30, squat: 37, plank: 63.0, energy: 8, sleep: 7, stress: 5, motivation: 9, note: '4 meses — voltou focado após feedback direto' },
    ],

    # Juliana — retorno pós-parto, progressão cuidadosa e consistente
    retorno_pos_parto: [
      { date: '2026-03-15', type: 'initial',   weight: 72.0, fat: 31.0, muscle: 44.0, visceral: 9.0, waist: 90.0, hip: 106.0, arm: 27.0, thigh: 57.0, hr: 80, pushup: 4,  squat: 8,  plank: 12.0, energy: 4, sleep: 3, stress: 8, motivation: 8, note: '4 meses pós-parto, bebê não dorme, muito cansada' },
      { date: '2026-04-15', type: 'monthly',   weight: 71.0, fat: 29.5, muscle: 44.8, visceral: 8.5, waist: 88.5, hip: 104.5, arm: 27.3, thigh: 56.5, hr: 78, pushup: 5,  squat: 10, plank: 15.0, energy: 5, sleep: 4, stress: 7, motivation: 8, note: '1 mês — bebê dormindo mais, treino melhorou' },
      { date: '2026-05-15', type: 'monthly',   weight: 69.8, fat: 27.8, muscle: 45.8, visceral: 7.8, waist: 87.0, hip: 103.0, arm: 27.8, thigh: 55.8, hr: 76, pushup: 7,  squat: 13, plank: 20.0, energy: 6, sleep: 5, stress: 6, motivation: 9, note: '2 meses — diástase estabilizando' },
      { date: '2026-06-15', type: 'monthly',   weight: 68.5, fat: 26.0, muscle: 46.8, visceral: 7.2, waist: 85.5, hip: 101.5, arm: 28.2, thigh: 55.0, hr: 74, pushup: 9,  squat: 15, plank: 25.0, energy: 7, sleep: 6, stress: 5, motivation: 9, note: '3 meses — voltou quase ao peso pré-gravidez' },
      { date: '2026-07-15', type: 'monthly',   weight: 67.2, fat: 24.2, muscle: 47.8, visceral: 6.5, waist: 83.5, hip: 99.5,  arm: 28.8, thigh: 54.0, hr: 72, pushup: 11, squat: 17, plank: 30.0, energy: 7, sleep: 7, stress: 4, motivation: 10, note: '4 meses — resultado surpreendeu a ela mesma' },
    ],

    # Marcos — estresse altíssimo, sono ruim, treino como válvula de escape
    estresse_alto_sono_ruim: [
      { date: '2026-02-20', type: 'initial',   weight: 86.0, fat: 27.0, muscle: 56.5, visceral: 11.0, waist: 94.0, hip: 102.0, arm: 32.0, thigh: 56.0, hr: 80, pushup: 14, squat: 18, plank: 30.0, energy: 4, sleep: 3, stress: 9, motivation: 7, note: 'Muita tensão no trabalho, lombalgia ativa' },
      { date: '2026-03-20', type: 'monthly',   weight: 85.0, fat: 26.0, muscle: 57.0, visceral: 10.5, waist: 93.0, hip: 101.5, arm: 32.2, thigh: 55.8, hr: 78, pushup: 15, squat: 20, plank: 33.0, energy: 5, sleep: 4, stress: 9, motivation: 7, note: '1 mês — lombalgia melhorou, estresse igual' },
      { date: '2026-04-20', type: 'monthly',   weight: 84.2, fat: 25.0, muscle: 57.8, visceral: 10.0, waist: 92.0, hip: 101.0, arm: 32.5, thigh: 55.5, hr: 76, pushup: 17, squat: 22, plank: 38.0, energy: 5, sleep: 4, stress: 8, motivation: 8, note: '2 meses — diz que treino é a melhor parte do dia' },
      { date: '2026-05-20', type: 'monthly',   weight: 83.5, fat: 24.0, muscle: 58.5, visceral: 9.5, waist: 91.0, hip: 100.5, arm: 32.8, thigh: 55.2, hr: 74, pushup: 18, squat: 24, plank: 42.0, energy: 6, sleep: 5, stress: 8, motivation: 8, note: '3 meses — corpo melhorando, mente ainda pesada' },
      { date: '2026-06-20', type: 'monthly',   weight: 82.8, fat: 23.2, muscle: 59.0, visceral: 9.2, waist: 90.5, hip: 100.0, arm: 33.0, thigh: 55.0, hr: 73, pushup: 20, squat: 25, plank: 45.0, energy: 6, sleep: 5, stress: 7, motivation: 8, note: '4 meses — tirou férias, voltou mais descansado' },
      { date: '2026-07-20', type: 'quarterly', weight: 81.5, fat: 22.0, muscle: 60.0, visceral: 8.8, waist: 89.0, hip: 99.0,  arm: 33.5, thigh: 54.5, hr: 71, pushup: 22, squat: 27, plank: 50.0, energy: 7, sleep: 6, stress: 6, motivation: 9, note: 'Trimestral — composição ótima, sono ainda desafio' },
    ],

  }.freeze

  # ── Timeline events semanais ──────────────────────────────────────────────

  WEEKS = {

    perda_gordura_runner: [
      { date: '2026-05-06 07:30:00', sono_text: 'Dormi bem, 8h',           carga_text: 'Corrida 8 km + musculação', sono_score: 8, carga_score: 8, humor: 9, obs: 'Joelho zero dor hoje' },
      { date: '2026-05-13 07:30:00', sono_text: 'Excelente, 9h',           carga_text: 'Treino funcional intenso',  sono_score: 9, carga_score: 9, humor: 9, obs: 'Semana perfeita' },
      { date: '2026-05-20 07:30:00', sono_text: 'Bom',                     carga_text: 'Corrida 10 km teste',       sono_score: 8, carga_score: 9, humor: 10, obs: 'Completou 10 km pela primeira vez!' },
      { date: '2026-05-27 07:30:00', sono_text: 'Muito bom',               carga_text: 'Deload + mobilidade',       sono_score: 9, carga_score: 6, humor: 9, obs: 'Recuperação ativa, se sentiu ótima' },
      { date: '2026-06-03 07:30:00', sono_text: 'Perfeito',                carga_text: 'Volta à carga total',       sono_score: 9, carga_score: 9, humor: 10, obs: 'Reavaliação semana que vem, animada' },
    ],

    ganho_massa_consistente: [
      { date: '2026-05-06 06:00:00', sono_text: 'Bom, 8h',                 carga_text: 'Treino pesadíssimo',        sono_score: 8, carga_score: 10, humor: 9, obs: 'PR no supino: 100 kg' },
      { date: '2026-05-13 06:00:00', sono_text: 'Ótimo',                   carga_text: 'Volume alto',               sono_score: 9, carga_score: 9,  humor: 10, obs: 'Progrediu em todos os exercícios' },
      { date: '2026-05-20 06:00:00', sono_text: 'Excelente',               carga_text: 'Deload programado',         sono_score: 9, carga_score: 6,  humor: 9, obs: 'Deload tranquilo, recuperando bem' },
      { date: '2026-05-27 06:00:00', sono_text: 'Dormi 9h',                carga_text: 'Início do cutting',         sono_score: 9, carga_score: 9,  humor: 8, obs: 'Ajustando alimentação pro cutting' },
      { date: '2026-06-03 06:00:00', sono_text: 'Muito bom',               carga_text: 'Cutting + alta intensidade', sono_score: 8, carga_score: 9, humor: 9, obs: 'Mantendo força no cutting, excelente' },
    ],

    emagrecimento_ansioso: [
      { date: '2026-05-05 09:00:00', sono_text: 'Ruim, ansiosa',           carga_text: 'Leve, preferiu assim',      sono_score: 4, carga_score: 5, humor: 5, obs: 'Semana difícil no trabalho' },
      { date: '2026-05-12 09:00:00', sono_text: 'Um pouco melhor',         carga_text: 'Moderado',                  sono_score: 5, carga_score: 6, humor: 6, obs: 'Sessão de terapia ajudou muito' },
      { date: '2026-05-19 09:00:00', sono_text: 'Razoável',                carga_text: 'Normal',                    sono_score: 6, carga_score: 6, humor: 7, obs: 'Mais estável emocionalmente essa semana' },
      { date: '2026-05-26 09:00:00', sono_text: 'Bom',                     carga_text: 'Conseguiu se desafiar',     sono_score: 7, carga_score: 7, humor: 7, obs: 'Primeira vez que gostou do treino intenso' },
      { date: '2026-06-02 09:00:00', sono_text: 'Bom, 7h',                 carga_text: 'Moderado-alto',             sono_score: 7, carga_score: 7, humor: 8, obs: 'Comentou que se sente orgulhosa' },
    ],

    atleta_esportivo_oscilante: [
      { date: '2026-05-05 08:00:00', sono_text: 'Péssimo, jogo sábado',    carga_text: 'Fraco, cansado do jogo',    sono_score: 3, carga_score: 3, humor: 4, obs: 'Jogou domingo, voltou sem energia' },
      { date: '2026-05-12 08:00:00', sono_text: 'Ruim ainda',              carga_text: 'Torneio mais pesado',       sono_score: 3, carga_score: 2, humor: 3, obs: 'Faltou 2 treinos pelo torneio' },
      { date: '2026-05-19 08:00:00', sono_text: 'Melhorou',                carga_text: 'Voltou mas caiu de rendimento', sono_score: 5, carga_score: 5, humor: 5, obs: 'Torneio acabou, foco volta ao treino' },
      { date: '2026-05-26 08:00:00', sono_text: 'Bom',                     carga_text: 'Treino completo',           sono_score: 7, carga_score: 7, humor: 8, obs: 'Quando tem rotina é excelente atleta' },
      { date: '2026-06-02 08:00:00', sono_text: 'Muito bom',               carga_text: 'Alta intensidade',          sono_score: 8, carga_score: 8, humor: 8, obs: 'Melhor semana do mês, sem campeonatos' },
    ],

    manutencao_saude_senior: [
      { date: '2026-05-05 10:00:00', sono_text: 'Bom, 8h',                 carga_text: 'Leve, preferiu',            sono_score: 7, carga_score: 5, humor: 7, obs: 'PA 130/85 antes do treino, ok para treinar' },
      { date: '2026-05-12 10:00:00', sono_text: 'Muito bom',               carga_text: 'Moderado',                  sono_score: 8, carga_score: 6, humor: 8, obs: 'Disse que está dormindo melhor que anos atrás' },
      { date: '2026-05-19 10:00:00', sono_text: 'Bom',                     carga_text: 'Normal',                    sono_score: 7, carga_score: 6, humor: 7, obs: 'Médico reduziu medicação de pressão' },
      { date: '2026-05-26 10:00:00', sono_text: 'Ótimo',                   carga_text: 'Moderado',                  sono_score: 8, carga_score: 6, humor: 8, obs: 'Consistência impecável, nunca falta' },
      { date: '2026-06-02 10:00:00', sono_text: 'Excelente',               carga_text: 'Moderado-alto pra ela',     sono_score: 9, carga_score: 7, humor: 9, obs: 'Animada com a redução da medicação' },
    ],

    definicao_jovem_inconsistente: [
      { date: '2026-06-09 11:00:00', sono_text: 'Ruim, balada sexta',      carga_text: 'Muito fraco',               sono_score: 3, carga_score: 3, humor: 4, obs: 'Saiu quinta e sexta, treinou mal' },
      { date: '2026-06-16 11:00:00', sono_text: 'Ok',                      carga_text: 'Moderado',                  sono_score: 6, carga_score: 6, humor: 6, obs: 'Semana razoável' },
      { date: '2026-06-23 11:00:00', sono_text: 'Ruim de novo',            carga_text: 'Faltou segunda e terça',    sono_score: 3, carga_score: 2, humor: 4, obs: 'Faltou 2 treinos sem avisar' },
      { date: '2026-06-30 11:00:00', sono_text: 'Bom',                     carga_text: 'Voltou com tudo',           sono_score: 7, carga_score: 8, humor: 8, obs: 'Conversamos sério sobre consistência' },
      { date: '2026-07-07 11:00:00', sono_text: 'Muito bom',               carga_text: 'Excelente',                 sono_score: 8, carga_score: 9, humor: 9, obs: 'Melhor semana desde que começou' },
    ],

    retorno_pos_parto: [
      { date: '2026-06-17 09:30:00', sono_text: 'Ruim, bebê acordou 3x',   carga_text: 'Leve',                      sono_score: 3, carga_score: 5, humor: 7, obs: 'Cansada mas não faltou — determinação' },
      { date: '2026-06-24 09:30:00', sono_text: 'Melhorou, 6h seguidas',   carga_text: 'Moderado',                  sono_score: 5, carga_score: 6, humor: 7, obs: 'Marido ajudou mais essa semana' },
      { date: '2026-07-01 09:30:00', sono_text: 'Bom, bebê dormiu melhor', carga_text: 'Moderado',                  sono_score: 6, carga_score: 6, humor: 8, obs: 'Disse que voltou a se sentir ela mesma' },
      { date: '2026-07-08 09:30:00', sono_text: 'Razoável',                carga_text: 'Um pouco mais pesado',      sono_score: 6, carga_score: 7, humor: 8, obs: 'Diástase não incomoda mais' },
      { date: '2026-07-15 09:30:00', sono_text: 'Bom',                     carga_text: 'Moderado-alto',             sono_score: 7, carga_score: 7, humor: 9, obs: 'Animada com o progresso, postou no insta' },
    ],

    estresse_alto_sono_ruim: [
      { date: '2026-06-10 06:30:00', sono_text: 'Péssimo, 4h',             carga_text: 'Leve mas foi',              sono_score: 2, carga_score: 4, humor: 4, obs: 'Prazo de projeto no trabalho, exausto' },
      { date: '2026-06-17 06:30:00', sono_text: 'Ruim, 5h',                carga_text: 'Moderado',                  sono_score: 3, carga_score: 6, humor: 5, obs: 'Prazo passou, ainda desregulado' },
      { date: '2026-06-24 06:30:00', sono_text: 'Um pouco melhor, 6h',     carga_text: 'Normal',                    sono_score: 5, carga_score: 7, humor: 6, obs: 'Trabalho mais tranquilo, sono voltando' },
      { date: '2026-07-01 06:30:00', sono_text: 'Bom, entrou de férias',   carga_text: 'Pesado, aproveitou férias', sono_score: 8, carga_score: 8, humor: 8, obs: 'Férias transformaram o humor dele' },
      { date: '2026-07-08 06:30:00', sono_text: 'Voltou do trabalho, 5h',  carga_text: 'Moderado',                  sono_score: 4, carga_score: 6, humor: 5, obs: 'Primeiro dia de volta ao trabalho foi pesado' },
    ],

  }.freeze
end
