# frozen_string_literal: true

module Invoices
  class UpdateStatusSubscriber < ApplicationSubscriber
    on_publish :transaction_updated, :transaction_deleted

    def on_transaction_updated(event)
      transaction = event.payload.fetch(:record)
      return unless transaction.paid_previously_changed?
      return if (invoice = transaction.invoice).blank?

      if transaction.paid?
        invoice.mark_as_paid!
      else
        invoice.mark_as_unpaid!
      end
    end

    def on_transaction_deleted(event)
      transaction = event.payload.fetch(:record)
      return if (invoice = transaction.invoice).blank?

      invoice.mark_as_canceled!
    end
  end
end
