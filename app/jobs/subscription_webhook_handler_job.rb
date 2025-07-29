# frozen_string_literal: true

class SubscriptionWebhookHandlerJob < ApplicationJob
  queue_as :event_handlers

  def perform(webhook_id)
    webhook = SubscriptionWebhook.find(webhook_id)
    return if webhook.blank?
    return if webhook.processed? || webhook.skipped?

    begin
      SubscriptionWebhook.transaction do
        event = ::Stripe::Event.construct_from(webhook.event)
        case event.type
        when 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'
          process_subscription_webhook(event)
          webhook.mark_as_processed!
        when 'invoice.created', 'invoice.payment_action_required', 'invoice.payment_succeeded', 'invoice.payment_failed'
          process_invoice_webhook(event)
          webhook.mark_as_processed!
        else
          message_log = "Unhandled Stripe event: #{event.type}"
          webhook.mark_as_skipped!(message_log:)
          Rails.logger.debug(message_log)
        end
      end
    rescue StandardError => e
      webhook.mark_as_failed!(message_log: e.message, trace: e.backtrace)
      Rails.logger.error(e.message)
      raise e
    end
  end

  private

  def process_subscription_webhook(event)
    stripe_subscription = event.data.object

    account = Account.find_by(processor_customer_id: stripe_subscription.customer)
    return if account.blank?

    Subscriptions::Upsert.call(account:, stripe_subscription:)
  end

  def process_invoice_webhook(event)
    stripe_invoice = event.data.object

    account = Account.find_by(processor_customer_id: stripe_invoice.customer)
    return if account.blank?

    result = Subscriptions::Upsert.call(account:, stripe_subscription: Stripe::Subscription.retrieve(stripe_invoice.subscription))
    return unless result.success?

    subscription = result.subscription
    result = SubscriptionInvoices::Upsert.call(account:, subscription: result.subscription, stripe_invoice:)
    return unless result.success?
    return if stripe_invoice.charge.blank?

    subscription_invoice = result.subscription_invoice
    stripe_charge = Stripe::Charge.retrieve(stripe_invoice.charge)
    SubscriptionCharges::Upsert.call(account:, subscription:, subscription_invoice:, stripe_charge:)
  end
end
