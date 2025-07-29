# frozen_string_literal: true

module Transactions
  class Duplicate < ApplicationService
    def call
      ActiveRecord::Base.transaction do
        transaction = context.transaction.dup
        if transaction.detailed?
          transaction.children = context.transaction.children.map(&:dup)
        end
        transaction.tag_list = context.transaction.tag_list
        context.transaction = transaction
        context.transaction.reset_installment_attributes
        dispatch_event if context.transaction.save

        set_feedback_message
      end
    end

    private

    def dispatch_event
      # # publish 'transaction_created', transaction: context.transaction
    end

    def set_feedback_message
      if context.transaction.errors.any?
        context.fail!(message: context.transaction.errors.full_messages.first)
      else
        context.message = I18n.t('transactions.duplicate.success')
      end
    end
  end
end
