# frozen_string_literal: true

# Adiciona versões numéricas dos campos textuais de sono/carga e um score de
# humor — extraídos da transcrição de áudio ou preenchidos manualmente.
# Coexistem com os campos de texto (que preservam a voz do atleta); os scores
# permitem séries temporais e médias sem depender de NLP posterior.
class AddScoresToTimelineEvents < ActiveRecord::Migration[7.0]
  def change
    add_column :timeline_events, :sono_score,   :integer  # 1–10
    add_column :timeline_events, :carga_score,  :integer  # 1–10
    add_column :timeline_events, :humor_score,  :integer  # 1–10 (disposição / ânimo)

    add_index :timeline_events, [:contact_id, :sono_score],
              name: 'idx_timeline_events_contact_sono_score',
              where: 'sono_score IS NOT NULL'

    add_index :timeline_events, [:contact_id, :carga_score],
              name: 'idx_timeline_events_contact_carga_score',
              where: 'carga_score IS NOT NULL'
  end
end
