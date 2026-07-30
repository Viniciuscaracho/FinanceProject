# frozen_string_literal: true

# Seed de validação — 4 perfis analíticos distintos de atletas.
#
# Objetivo: verificar se a camada de dados suporta os gráficos e alertas
# analíticos que o personal precisaria. Cada cenário representa um arco
# narrativo diferente, observável nos dados gerados.
#
# Cenários:
#   A — Progressão consistente   → o modelo ideal: tudo melhorando
#   B — Platô                    → estagnação total há 3 meses
#   C — Regressão / sinal de alerta → piora de composição + bem-estar
#   D — Iniciante sem histórico  → apenas avaliação inicial, sem série
class SeedCoachingAssessmentsPoc < ActiveRecord::Migration[7.0]
  def up
    ActsAsTenant.without_tenant do
      Account.find_each do |account|
        contacts_with_profile = contact_ids_with_profile(account.id)
        next if contacts_with_profile.empty?

        contacts_with_profile.first(4).each_with_index do |contact_id, idx|
          scenario = SCENARIOS[idx]
          next unless scenario

          say "  Conta #{account.id} | contato #{contact_id} → Cenário #{scenario[:label]}"
          seed_assessments(account.id, contact_id, scenario)
          seed_timeline_scores(account.id, contact_id, scenario)
        end
      end
    end
  end

  def down
    ActsAsTenant.without_tenant do
      execute "DELETE FROM coaching_assessments WHERE notes LIKE '%[POC]%'"
      execute "UPDATE timeline_events SET sono_score = NULL, carga_score = NULL, humor_score = NULL"
    end
  end

  private

  # ── Queries auxiliares ─────────────────────────────────────────────────────

  def contact_ids_with_profile(account_id)
    execute(
      "SELECT contact_id FROM coaching_profiles WHERE account_id = #{account_id} ORDER BY id LIMIT 4"
    ).map { |r| r['contact_id'] }
  end

  # ── Geração de avaliações ──────────────────────────────────────────────────

  def seed_assessments(account_id, contact_id, scenario)
    scenario[:assessments].each do |snap|
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
          #{account_id}, #{contact_id},
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

  def seed_timeline_scores(account_id, contact_id, scenario)
    scenario[:weekly_scores].each do |week|
      execute <<~SQL
        INSERT INTO timeline_events (
          account_id, contact_id, source,
          sono, carga,
          sono_score, carga_score, humor_score,
          observacao,
          created_at, updated_at
        ) VALUES (
          #{account_id}, #{contact_id}, 'poc_seed',
          '#{week[:sono_text]}', '#{week[:carga_text]}',
          #{week[:sono_score]}, #{week[:carga_score]}, #{week[:humor]},
          '#{week[:obs]}',
          '#{week[:date]}', '#{week[:date]}'
        )
      SQL
    end
  end

  # ── Cenários ───────────────────────────────────────────────────────────────
  # Datas relativas ao momento do seed para facilitar leitura nos gráficos.

  SCENARIOS = [

    # ── A: Progressão consistente ────────────────────────────────────────────
    # Atleta que responde bem ao programa: perde gordura, ganha músculo,
    # melhora funcionais e bem-estar. O gráfico ideal para mostrar ao cliente.
    {
      label: 'A — Progressão consistente',
      assessments: [
        { date: '2026-01-15', type: 'initial',   weight: 88.5, fat: 28.0, muscle: 57.2, visceral: 12.0, waist: 96.0, hip: 104.0, arm: 32.0, thigh: 56.0, hr: 72, pushup: 15, squat: 20, plank: 30.0, energy: 5, sleep: 5, stress: 6, motivation: 7, note: 'Avaliação inicial' },
        { date: '2026-02-15', type: 'monthly',   weight: 86.8, fat: 26.5, muscle: 57.9, visceral: 11.5, waist: 94.0, hip: 102.5, arm: 32.5, thigh: 55.5, hr: 70, pushup: 18, squat: 23, plank: 38.0, energy: 6, sleep: 6, stress: 6, motivation: 7, note: '1 mês — boa adesão' },
        { date: '2026-03-15', type: 'monthly',   weight: 84.9, fat: 24.8, muscle: 58.8, visceral: 10.8, waist: 91.5, hip: 100.0, arm: 33.2, thigh: 54.8, hr: 68, pushup: 22, squat: 27, plank: 48.0, energy: 7, sleep: 7, stress: 5, motivation: 8, note: '2 meses — ganho muscular notável' },
        { date: '2026-04-15', type: 'monthly',   weight: 83.1, fat: 23.0, muscle: 59.8, visceral: 10.0, waist: 89.0, hip: 98.0,  arm: 34.0, thigh: 54.0, hr: 65, pushup: 26, squat: 31, plank: 58.0, energy: 8, sleep: 7, stress: 4, motivation: 9, note: '3 meses — composição excelente' },
        { date: '2026-05-15', type: 'monthly',   weight: 81.5, fat: 21.5, muscle: 60.5, visceral: 9.2,  waist: 87.0, hip: 96.5,  arm: 34.5, thigh: 53.5, hr: 63, pushup: 30, squat: 35, plank: 68.0, energy: 8, sleep: 8, stress: 4, motivation: 9, note: '4 meses — atleta referência' },
        { date: '2026-06-15', type: 'quarterly', weight: 80.2, fat: 20.1, muscle: 61.2, visceral: 8.5,  waist: 85.0, hip: 95.0,  arm: 35.0, thigh: 53.0, hr: 61, pushup: 34, squat: 38, plank: 80.0, energy: 9, sleep: 8, stress: 3, motivation: 10, note: 'Reavaliação trimestral — meta batida' },
      ],
      weekly_scores: [
        { date: '2026-05-05 08:00:00', sono_text: 'Dormi bem, umas 8h', carga_text: 'Treino pesado', sono_score: 8, carga_score: 8, humor: 9, obs: 'Semana ótima, sem dores' },
        { date: '2026-05-12 08:00:00', sono_text: 'Sono excelente',      carga_text: 'Alta intensidade',  sono_score: 9, carga_score: 9, humor: 9, obs: 'Bateu PR no agachamento' },
        { date: '2026-05-19 08:00:00', sono_text: 'Descansado',          carga_text: 'Treino moderado',   sono_score: 8, carga_score: 7, humor: 8, obs: 'Semana de deload, se sentiu bem' },
        { date: '2026-05-26 08:00:00', sono_text: 'Dormiu bem',          carga_text: 'Voltou à carga alta', sono_score: 8, carga_score: 9, humor: 9, obs: 'Energia ótima pós-deload' },
        { date: '2026-06-02 08:00:00', sono_text: 'Muito bom',           carga_text: 'Pesadíssimo',       sono_score: 9, carga_score: 10, humor: 10, obs: 'Reavaliação chegando, motivadíssimo' },
      ]
    },

    # ── B: Platô ─────────────────────────────────────────────────────────────
    # Atleta que evoluiu nos primeiros meses mas estagnou completamente.
    # Composição parou, funcionais pararam, bem-estar mediocre. Típico caso
    # onde o personal precisa mudar o estímulo ou investigar fatores externos.
    {
      label: 'B — Platô',
      assessments: [
        { date: '2026-01-10', type: 'initial',   weight: 75.0, fat: 22.0, muscle: 52.5, visceral: 8.0, waist: 82.0, hip: 95.0, arm: 30.0, thigh: 52.0, hr: 68, pushup: 20, squat: 25, plank: 45.0, energy: 6, sleep: 6, stress: 5, motivation: 7, note: 'Avaliação inicial' },
        { date: '2026-02-10', type: 'monthly',   weight: 73.8, fat: 20.5, muscle: 53.5, visceral: 7.5, waist: 80.0, hip: 93.5, arm: 30.8, thigh: 51.5, hr: 66, pushup: 23, squat: 28, plank: 52.0, energy: 7, sleep: 7, stress: 5, motivation: 7, note: '1 mês — boa resposta inicial' },
        { date: '2026-03-10', type: 'monthly',   weight: 73.1, fat: 20.0, muscle: 53.9, visceral: 7.3, waist: 79.5, hip: 93.0, arm: 31.0, thigh: 51.2, hr: 66, pushup: 24, squat: 29, plank: 54.0, energy: 6, sleep: 6, stress: 5, motivation: 6, note: '2 meses — desaceleração clara' },
        { date: '2026-04-10', type: 'monthly',   weight: 73.0, fat: 20.0, muscle: 53.8, visceral: 7.3, waist: 79.5, hip: 93.0, arm: 31.0, thigh: 51.2, hr: 67, pushup: 24, squat: 29, plank: 54.0, energy: 6, sleep: 6, stress: 6, motivation: 6, note: '3 meses — estagnação total' },
        { date: '2026-05-10', type: 'monthly',   weight: 73.2, fat: 20.1, muscle: 53.7, visceral: 7.4, waist: 79.8, hip: 93.2, arm: 30.9, thigh: 51.3, hr: 67, pushup: 23, squat: 28, plank: 53.0, energy: 5, sleep: 6, stress: 6, motivation: 5, note: '4 meses — platô completo, leve piora' },
        { date: '2026-06-10', type: 'quarterly', weight: 73.1, fat: 20.0, muscle: 53.8, visceral: 7.3, waist: 79.5, hip: 93.1, arm: 30.9, thigh: 51.2, hr: 67, pushup: 24, squat: 29, plank: 54.0, energy: 5, sleep: 6, stress: 6, motivation: 5, note: 'Reavaliação — nenhuma melhora há 3 meses' },
      ],
      weekly_scores: [
        { date: '2026-05-05 09:00:00', sono_text: 'Razoável', carga_text: 'Normal',          sono_score: 6, carga_score: 6, humor: 5, obs: 'Sem novidades, rotina igual' },
        { date: '2026-05-12 09:00:00', sono_text: 'Ok',       carga_text: 'Igual de sempre',  sono_score: 6, carga_score: 6, humor: 5, obs: 'Nada de diferente para reportar' },
        { date: '2026-05-19 09:00:00', sono_text: 'Normal',   carga_text: 'Mesma coisa',      sono_score: 6, carga_score: 6, humor: 5, obs: 'Continua igual, um pouco desmotivado' },
        { date: '2026-05-26 09:00:00', sono_text: 'Ok',       carga_text: 'Treino tranquilo', sono_score: 5, carga_score: 5, humor: 4, obs: 'Faltou energia essa semana' },
        { date: '2026-06-02 09:00:00', sono_text: 'Mais ou menos', carga_text: 'Leve',        sono_score: 5, carga_score: 5, humor: 4, obs: 'Pensando em pausar os treinos' },
      ]
    },

    # ── C: Regressão / sinal de alerta ────────────────────────────────────────
    # Atleta que estava bem mas está piorando ativamente: ganho de gordura,
    # perda de músculo, sono ruim, estresse alto. Alto risco de abandono.
    # O sistema deveria gerar alertas proativos para esse perfil.
    {
      label: 'C — Regressão / alerta',
      assessments: [
        { date: '2025-12-01', type: 'initial',   weight: 80.0, fat: 24.0, muscle: 55.0, visceral: 9.0, waist: 88.0, hip: 99.0, arm: 31.0, thigh: 53.0, hr: 70, pushup: 18, squat: 22, plank: 40.0, energy: 7, sleep: 7, stress: 5, motivation: 8, note: 'Avaliação inicial — bom ponto de partida' },
        { date: '2026-01-01', type: 'monthly',   weight: 79.0, fat: 22.8, muscle: 55.8, visceral: 8.6, waist: 86.5, hip: 97.5, arm: 31.5, thigh: 52.5, hr: 68, pushup: 21, squat: 25, plank: 47.0, energy: 7, sleep: 7, stress: 5, motivation: 8, note: '1 mês — progressão inicial saudável' },
        { date: '2026-02-01', type: 'monthly',   weight: 78.2, fat: 21.5, muscle: 56.5, visceral: 8.0, waist: 85.0, hip: 96.0, arm: 32.0, thigh: 52.0, hr: 66, pushup: 24, squat: 28, plank: 55.0, energy: 8, sleep: 8, stress: 4, motivation: 9, note: '2 meses — pico de evolução' },
        { date: '2026-03-01', type: 'monthly',   weight: 79.5, fat: 23.0, muscle: 55.8, visceral: 8.8, waist: 86.8, hip: 97.2, arm: 31.8, thigh: 52.8, hr: 69, pushup: 22, squat: 26, plank: 50.0, energy: 6, sleep: 6, stress: 7, motivation: 6, note: '3 meses — inversão, algo mudou na rotina' },
        { date: '2026-04-01', type: 'monthly',   weight: 81.0, fat: 24.8, muscle: 55.0, visceral: 9.5, waist: 88.5, hip: 99.0, arm: 31.2, thigh: 53.5, hr: 72, pushup: 19, squat: 22, plank: 42.0, energy: 5, sleep: 5, stress: 8, motivation: 5, note: '4 meses — regressão acentuada, estresse alto' },
        { date: '2026-05-01', type: 'monthly',   weight: 82.5, fat: 26.2, muscle: 54.2, visceral: 10.2, waist: 90.0, hip: 100.5, arm: 30.8, thigh: 54.0, hr: 75, pushup: 16, squat: 19, plank: 35.0, energy: 4, sleep: 4, stress: 9, motivation: 3, note: '5 meses — piora significativa, risco de abandono' },
      ],
      weekly_scores: [
        { date: '2026-04-07 07:00:00', sono_text: 'Dormi pouco, trabalho', carga_text: 'Treino fraco',      sono_score: 4, carga_score: 4, humor: 4, obs: 'Muito stress no trabalho essa semana' },
        { date: '2026-04-14 07:00:00', sono_text: 'Péssimo, 5h só',        carga_text: 'Muito leve',        sono_score: 3, carga_score: 3, humor: 3, obs: 'Quase não conseguiu ir treinar' },
        { date: '2026-04-21 07:00:00', sono_text: 'Ruim ainda',            carga_text: 'Faltou 2 treinos',  sono_score: 3, carga_score: 2, humor: 3, obs: 'Faltou segunda e quarta' },
        { date: '2026-04-28 07:00:00', sono_text: 'Melhorou um pouco',     carga_text: 'Voltou mas fraco',  sono_score: 5, carga_score: 4, humor: 4, obs: 'Voltou mas sem energia' },
        { date: '2026-05-05 07:00:00', sono_text: 'Ruim de novo',          carga_text: 'Muito leve',        sono_score: 3, carga_score: 3, humor: 3, obs: 'Reclamou de dor nas costas essa semana' },
      ]
    },

    # ── D: Iniciante — só avaliação inicial ──────────────────────────────────
    # Atleta que acabou de entrar. Sem série histórica ainda. Cenário importante
    # para garantir que a UI trate bem o caso de dados insuficientes.
    {
      label: 'D — Iniciante sem histórico',
      assessments: [
        { date: '2026-07-20', type: 'initial', weight: 92.0, fat: 31.0, muscle: 55.8, visceral: 14.0, waist: 100.0, hip: 108.0, arm: 33.0, thigh: 58.0, hr: 78, pushup: 10, squat: 15, plank: 20.0, energy: 5, sleep: 6, stress: 7, motivation: 8, note: 'Avaliação inicial — recém chegou, muito motivado' },
      ],
      weekly_scores: [
        { date: '2026-07-22 10:00:00', sono_text: 'Razoável', carga_text: 'Primeiro treino, pesado pra mim', sono_score: 6, carga_score: 7, humor: 8, obs: 'Adorou o treino mas ficou bem dolorido depois' },
        { date: '2026-07-28 10:00:00', sono_text: 'Melhor',   carga_text: 'Segunda sessão, mais tranquilo',  sono_score: 7, carga_score: 6, humor: 8, obs: 'Dor muscular passou, se sentiu melhor' },
      ]
    }

  ].freeze
end
