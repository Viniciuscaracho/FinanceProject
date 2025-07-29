module Transactions
  class BulkDestroy < ApplicationService
    def call
      transactions_ids = context.transactions_ids
      account = context.account

      transactions = account.transactions.includes(:payment_plan).find(transactions_ids)

      ActiveRecord::Base.transaction do
        context.transactions = transactions.map do |transaction|
          Transactions::Destroy.call(transaction:, option: context.option, skip_event: true).transaction
        end
      end

      failed_transactions = context.transactions.select { |transaction| transaction.errors.any? }
      if failed_transactions.any?
        first_error_transaction = failed_transactions.first
        return context.fail!(message: first_error_transaction.errors.full_messages.first)
      end

      set_feedback_message
    end

    private

    def dispatch_event(transaction)
      # # publish('transaction_deleted', transaction: transaction)
    end

    def set_feedback_message
      context.message = I18n.t('transactions.destroy.success')
    end
  end
end
