# frozen_string_literal: true

module Invoices
  class Create < ApplicationService
    def call
      invoice_params = context.invoice_params.merge(provider_id: context.account.company_id)
      context.invoice = context.account.invoices.new(invoice_params)

      Invoice.transaction do
        case context.action
        when 'mark_as_open'
          context.invoice.mark_as_open!
        when 'mark_as_paid'
          context.invoice.mark_as_paid!
        else
          context.invoice.save
        end
      end

      add_fail_message(context.invoice)
    end
  end
end
