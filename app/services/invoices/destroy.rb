# frozen_string_literal: true

module Invoices
  class Destroy < ApplicationService
    def call
      context.invoice.destroy
      return dispatch_event if context.invoice.destroyed?

      add_fail_message(context.invoice)
    end

    private

    def dispatch_event
      # # publish 'invoice_deleted', invoice: context.invoice
    end
  end
end
