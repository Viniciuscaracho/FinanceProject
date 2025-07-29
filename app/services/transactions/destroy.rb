# frozen_string_literal: true

module Transactions
  class Destroy < ApplicationService

    def call
      Transaction.transaction do
        if context.transaction.on_cash?
          destroy_transaction
          context.destroyed_transactions = [context.transaction]
          context.updated_transactions = []
        else
          destroy_installments
        end
        set_feedback_message
      end
    end

    private

    def destroy_installments
      case context.option.to_sym
      when :only_this_installment
        context.destroyed_transactions, context.updated_transactions = context.transaction.destroy_this_one
      when :this_and_next_installments
        context.destroyed_transactions, context.updated_transactions =  context.transaction.destroy_this_and_next_ones
      when :this_and_prev_installments
        context.destroyed_transactions, context.updated_transactions =  context.transaction.destroy_this_and_prev_ones
      when :prev_and_next_installments
        context.destroyed_transactions, context.updated_transactions = context.transaction.destroy_this_and_others
      else
        destroy_transaction
        context.destroyed_transactions = [context.transaction]
        context.updated_transactions = []
      end
    end

    def destroy_transaction
      context.transaction.destroy
      # dispatch_event if context.transaction.destroyed? && context.skip_event.blank?
    end

    def dispatch_event
      return if context.transaction.blank?

      # publish 'transaction_deleted', transaction: context.transaction
    end

    def set_feedback_message
      if context.transaction.errors.any?
        context.fail!(message: context.transaction.errors.full_messages.first)
      else
        context.message = I18n.t('transactions.destroy.success')
      end
    end
  end
end
