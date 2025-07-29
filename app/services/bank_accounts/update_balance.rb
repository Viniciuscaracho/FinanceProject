# frozen_string_literal: true

module BankAccounts
  class UpdateBalance < ApplicationService
    def call
      return if context.bank_account_id.blank?

      BankAccount.with_advisory_lock_by_id(context.bank_account_id) do
        context.bank_account = BankAccount.find_by(id: context.bank_account_id)
        context.bank_account.update_balance!
      end

      set_feedback_message
    end

    private

    def set_feedback_message
      if context.bank_account.errors.any?
        context.fail!(message: context.bank_account.errors.full_messages.first)
      else
        context.message = I18n.t('bank_accounts.update.success')
      end
    end
  end
end
