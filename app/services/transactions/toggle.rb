# frozen_string_literal: true

module Transactions
  class Toggle < ApplicationService
    def call
      Transactions::Update.call(
        account: context.transaction.account,
        transaction: context.transaction,
        transaction_params: {
          paid: !context.transaction.paid?,
          paid_at: !context.transaction.paid? ? DateTime.current : nil
        }
      )

      set_feedback_message
    end

    private

    def set_feedback_message
      if context.transaction.errors.any?
        context.fail!(message: I18n.t('transactions.toggle.error'))
      else
        context.message = I18n.t('transactions.toggle.success')
      end
    end
  end
end
