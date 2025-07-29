# frozen_string_literal: true

module SubscriptionInvoices
  class Upsert < ApplicationService
    def call
      processor_id = context.stripe_invoice.id
      # upsert the subscription invoice
      SubscriptionInvoice.with_advisory_lock("subscription_invoice:#{processor_id}:upsert") do
        context.subscription_invoice = context.account.subscription_invoices.find_or_initialize_by(
          subscription: context.subscription,
          processor_id:
        )
        context.subscription_invoice.sync!(context.stripe_invoice)
      end
    end
  end
end
