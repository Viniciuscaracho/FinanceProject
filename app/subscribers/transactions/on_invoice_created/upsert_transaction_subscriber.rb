# frozen_string_literal: true

module Transactions
  module OnInvoiceCreated
    class UpsertTransactionSubscriber < OnInvoiceUpdated::UpdateTransactionSubscriber
      on_publish :invoice_created

      def perform(event)
        invoice = event.payload.fetch(:record)
        return unless invoice.sync_with_transaction
        return unless invoice.open?

        if invoice.record.present?
          update_transaction(invoice:)
        else
          create_transaction(invoice:)
        end
      end

      private

      def create_transaction(invoice:)
        Invoice.transaction do
          result = Transactions::Create.call(
            account: invoice.account,
            grouped_expenses?: false,
            transaction_params: transaction_params(invoice)
          )
          invoice.update(record: result.transaction) if result.success?
        end
      end

      def transaction_params(invoice)
        {
          due_date: invoice.due_date,
          name: invoice.name,
          bank_account_id: invoice.bank_account_id,
          contact_id: invoice.recipient_id,
          amount_cents: invoice.total_cents,
          description: invoice.description
        }
      end
    end
  end
end
