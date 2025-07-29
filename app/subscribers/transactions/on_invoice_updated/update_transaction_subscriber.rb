# frozen_string_literal: true

module Transactions
  module OnInvoiceUpdated
    class UpdateTransactionSubscriber < ApplicationSubscriber
      on_publish :invoice_updated

      def perform(event)
        invoice = event.payload.fetch(:invoice)
        return unless invoice.sync_with_transaction
        return if invoice.record.blank?

        update_transaction(invoice:)
      end

      private

      def update_transaction(invoice:)
        Transactions::Update.call(
          account: invoice.account,
          transaction: invoice.record,
          option: :only_this_installment,
          transaction_params: transaction_params(invoice)
        )
      end

      def transaction_params(invoice)
        params = {
          due_date: invoice.due_date,
          name: invoice.name,
          bank_account_id: invoice.bank_account_id,
          contact_id: invoice.recipient_id,
          amount_cents: invoice.total_cents,
          description: invoice.description
        }
        return params unless invoice.status_previously_changed?

        case invoice.status.to_sym
        when :paid
          params[:paid] = true
        when :open
          params[:paid] = false
        end

        params
      end
    end
  end
end
