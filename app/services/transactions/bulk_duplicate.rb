module Transactions

  class BulkDuplicate < ApplicationService
    def call
      transactions = context.transactions

      ActiveRecord::Base.transaction do
        context.transactions = transactions.map do |transaction|
          transaction_dup = transaction.dup
          if transaction_dup.detailed?
            transaction_dup.children = transaction.children.map(&:dup)
          end
          transaction_dup.tag_list = transaction.tag_list
          transaction_dup.reset_installment_attributes

          transaction_dup
        end

        Transaction.import(context.transactions, recursive: true)
      end

      set_feedback_message
    end

    private

    def set_feedback_message
      context.message = I18n.t('transactions.duplicate.success')
    end

  end
end