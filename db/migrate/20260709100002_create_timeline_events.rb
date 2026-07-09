class CreateTimelineEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :timeline_events do |t|
      t.references :account, null: false, foreign_key: true
      t.bigint  :contact_id,      null: false
      t.bigint  :account_user_id
      t.text    :raw_input
      t.string  :source,          default: 'manual'
      t.string  :sono
      t.string  :carga
      t.text    :observacao
      t.text    :proxima_acao

      t.timestamps
    end

    add_index :timeline_events, [:account_id, :contact_id, :created_at], name: 'idx_timeline_events_account_contact_date'
    add_foreign_key :timeline_events, :people, column: :contact_id
    add_foreign_key :timeline_events, :account_users, column: :account_user_id
  end
end
