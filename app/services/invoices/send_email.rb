# frozen_string_literal: true

module Invoices
  class SendEmail < ApplicationService
    def call
      # invoice = context.invoice
      # provider_email = context.provider_email
      # recipient_emails = context.recipient_emails
      # subject_line = context.subject_line
      #
      #
      # return dispatch_event if context.invoice.destroyed?
      #
      # add_fail_message(context.invoice)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.invoice, event: InvoiceDiscarded)
    end
  end
end
