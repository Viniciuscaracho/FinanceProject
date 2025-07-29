# frozen_string_literal: true

module BankAccounts
  class Update < ApplicationService
    def call
      return if context.bank_account.blank?

      ActiveRecord::Base.transaction do
        context.bank_account.update(context.bank_account_params)
        context.bank_account.update_balance! if context.bank_account.initial_balance_cents_previously_changed?

        # publish 'bank_account_updated', bank_account: context.bank_account

        set_feedback_message
      end
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
