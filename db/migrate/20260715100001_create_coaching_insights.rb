class CreateCoachingInsights < ActiveRecord::Migration[7.0]
  def change
    create_table :coaching_insights do |t|
      t.references :account, null: false, foreign_key: true
      t.bigint  :contact_id,    null: false
      t.string  :insight_type,  null: false
      t.text    :insight_text,  null: false
      t.string  :severity,      null: false, default: 'medium'
      t.jsonb   :related_dates, null: false, default: []
      t.datetime :expires_at

      t.timestamps
    end

    add_index :coaching_insights, [:account_id, :created_at]
    add_index :coaching_insights, [:account_id, :contact_id, :created_at], name: 'idx_coaching_insights_account_contact_date'
    add_foreign_key :coaching_insights, :people, column: :contact_id
  end
end
