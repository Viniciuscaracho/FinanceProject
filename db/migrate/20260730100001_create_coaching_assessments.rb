# frozen_string_literal: true

# Avaliações periódicas estruturadas do atleta.
# Captura composição corporal, medidas antropométricas, testes funcionais e
# scores de bem-estar num único snapshot datado — base para gráficos de
# evolução e comparação entre períodos.
class CreateCoachingAssessments < ActiveRecord::Migration[7.0]
  def change
    create_table :coaching_assessments do |t|
      t.references :account,      null: false, foreign_key: true
      t.references :contact,      null: false, foreign_key: { to_table: :people }
      t.references :account_user, null: true,  foreign_key: true

      # ── Composição corporal ─────────────────────────────────────────────
      t.decimal :weight_kg,          precision: 5, scale: 2
      t.decimal :body_fat_pct,       precision: 4, scale: 1  # % gordura corporal
      t.decimal :muscle_mass_kg,     precision: 5, scale: 2
      t.decimal :visceral_fat_index, precision: 4, scale: 1

      # ── Medidas antropométricas (cm) ────────────────────────────────────
      t.decimal :waist_cm,  precision: 5, scale: 1
      t.decimal :hip_cm,    precision: 5, scale: 1
      t.decimal :chest_cm,  precision: 5, scale: 1
      t.decimal :arm_cm,    precision: 5, scale: 1  # circunferência do braço (relaxado)
      t.decimal :thigh_cm,  precision: 5, scale: 1

      # ── Sinais vitais ───────────────────────────────────────────────────
      t.integer :resting_hr_bpm   # frequência cardíaca em repouso
      t.string  :blood_pressure   # "120/80"

      # ── Testes funcionais ───────────────────────────────────────────────
      t.integer :push_up_reps     # flexões em 1 min
      t.integer :squat_reps       # agachamentos em 1 min
      t.decimal :plank_seconds,   precision: 6, scale: 1
      t.decimal :vo2max_estimate, precision: 4, scale: 1  # ml/kg/min (teste de campo)

      # ── Scores de bem-estar no dia da avaliação (1–10) ──────────────────
      t.integer :energy_score      # disposição geral
      t.integer :sleep_score       # qualidade de sono
      t.integer :stress_score      # nível de estresse (invertido: 10 = sem estresse)
      t.integer :motivation_score  # motivação para treinar

      # ── Metadados ───────────────────────────────────────────────────────
      t.date    :assessed_on,      null: false
      t.string  :assessment_type,  null: false, default: 'monthly'
      # valores: 'initial' | 'monthly' | 'quarterly' | 'annual' | 'custom'
      t.text    :notes

      t.timestamps
    end

    # Consultas mais comuns: evolução cronológica de um atleta
    add_index :coaching_assessments, [:account_id, :contact_id, :assessed_on],
              name: 'idx_coaching_assessments_contact_timeline'

    # Busca de todas as avaliações de uma conta num período
    add_index :coaching_assessments, [:account_id, :assessed_on]
  end
end
