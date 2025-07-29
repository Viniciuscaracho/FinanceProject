# frozen_string_literal: true

module Webhooks
  class DeliverJobSubscriber < ApplicationSubscriber
    on_publish(*%i[transaction_created transaction_updated transaction_deleted
                   bank_account_created bank_account_updated bank_account_deleted
                   contact_created contact_updated contact_deleted
                   category_created category_updated category_deleted
                   cost_center_created cost_center_updated cost_center_deleted
                   user_created user_updated user_deleted])

    def perform(event)
      record = event.payload.fetch(:record)
      return if record.blank?
      return unless record.account.api_enabled?

      webhook = record.account.webhook
      return if webhook.blank? || webhook.url.blank?

      payload = record.to_webhook_data

      WebhookDeliverJob.perform_later(webhook:, payload:, event_name: event.name)
    end
  end
end
