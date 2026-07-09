class CreateCoachingProfiles < ActiveRecord::Migration[7.0]
  def change
    create_table :coaching_profiles do |t|
      t.references :contact, null: false, foreign_key: { to_table: :people }
      t.references :account, null: false, foreign_key: true
      t.text    :goal
      t.text    :limitations
      t.datetime :next_reassessment_at
      t.datetime :last_feedback_at

      t.timestamps
    end

    add_index :coaching_profiles, [:account_id, :last_feedback_at]
    add_index :coaching_profiles, [:account_id, :next_reassessment_at]
  end
end
