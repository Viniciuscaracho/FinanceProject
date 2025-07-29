# frozen_string_literal: true

module Invoices
  class Update < ApplicationService
    def call
      context.invoice.assign_attributes(context.invoice_params)

      Invoice.transaction do
        case context.action
        when 'mark_as_open'
          context.invoice.mark_as_open!
        when 'mark_as_paid'
          context.invoice.mark_as_paid!
        when 'mark_as_canceled'
          context.invoice.mark_as_canceled!
        else
          context.invoice.save
        end
      end

      # # publish 'invoice_updated', invoice: context.invoice
      add_fail_message(context.invoice)
    end
  end
end
