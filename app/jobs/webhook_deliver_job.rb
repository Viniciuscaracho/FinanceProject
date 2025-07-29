# frozen_string_literal: true

class WebhookDeliveryError < StandardError
  def initialize(message = 'Webhook delivery failed')
    super
  end
end

class WebhookDeliverJob < ApplicationJob
  include HTTParty

  retry_on WebhookDeliveryError, attempts: 10, wait: :exponentially_longer, queue: :webhook_retries
  queue_as :webhooks

  def perform(webhook:, payload:, event_name: nil)
    return if webhook.blank? || webhook.url.blank?

    response = deliver_webhook(webhook, build_payload(event_name, payload))
    update_webhook(webhook, response)
    handle_response_errors(response)
  end

  private

  def deliver_webhook(webhook, payload)
    HTTParty.post(webhook.url, body: payload.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  def update_webhook(webhook, response)
    webhook.update!(last_used_at: Time.current, last_response: response.code)
  end

  def handle_response_errors(response)
    raise WebhookDeliveryError, response.message unless response.success?
  end

  def build_payload(event, data)
    {
      event:,
      data:
    }
  end
end
