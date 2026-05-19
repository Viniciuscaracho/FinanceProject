# frozen_string_literal: true

class CreateWhatsappMessages < ActiveRecord::Migration[7.0]
  def change
    create_table :whatsapp_messages do |t|
      t.references :account,  null: false, foreign_key: true
      t.references :contact,  null: false, foreign_key: { to_table: :people }

      t.string   :event_type,       null: false
      t.string   :channel,          null: false, default: 'bot'
      t.string   :status,           null: false, default: 'pending'
      t.string   :idempotency_key,  null: false
      t.text     :body
      t.datetime :scheduled_for
      t.datetime :sent_at
      t.string   :reference_type
      t.bigint   :reference_id
      t.string   :external_id
      t.string   :error_message
      t.json     :metadata

      t.timestamps
    end

    add_index :whatsapp_messages, :idempotency_key, unique: true
    add_index :whatsapp_messages, [:contact_id, :scheduled_for]
    add_index :whatsapp_messages, [:status, :scheduled_for]
    add_index :whatsapp_messages, [:reference_type, :reference_id]
  end
end
