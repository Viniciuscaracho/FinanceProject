class AddFailedMessageToSubscriptionWebhook < ActiveRecord::Migration[7.0]
  def change
    add_column :subscription_webhooks, :details, :jsonb, default: {}, null: false
  end
end
