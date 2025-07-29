module Transactions
  class BulkMoveTo < ApplicationService
    def call
      params = context.params
      transactions = context.transactions

      ActiveRecord::Base.transaction do
        transactions.each do |transaction|
          transaction.update!(params)
          if transaction.detailed?
            transaction.children.each do |detailed_transaction|
              detailed_transaction.update!(params)
            end
          end
        end
      end

      publish 'transaction_updated', record: transactions.first
    end

    private

    def set_feedback_message
      context.message = I18n.t('transactions.update.success')
    end
  end
end