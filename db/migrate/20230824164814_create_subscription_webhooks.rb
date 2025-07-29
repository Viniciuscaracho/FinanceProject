# frozen_string_literal: true

class CreateSubscriptionWebhooks < ActiveRecord::Migration[7.0]
  def change
    create_table :subscription_webhooks do |t|
      t.string :event_type, null: false
      t.string :status, null: false, default: 'pending'
      t.jsonb :event, null: false, default: {}

      t.timestamps
    end
  end
end
