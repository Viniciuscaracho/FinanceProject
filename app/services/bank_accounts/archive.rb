# frozen_string_literal: true

module BankAccounts
  class Archive < ApplicationService
    def call
      ActiveRecord::Base.transaction do
        dispatch_event if context.bank_account.discard
        set_feedback_message
      end
    end

    private

    def dispatch_event
      # publish 'bank_account_updated', bank_account: context.bank_account
    end

    def set_feedback_message
      if context.bank_account.errors.any?
        context.fail!(message: context.bank_account.errors.full_messages.first)
      else
        context.message = I18n.t('bank_accounts.archive.success')
      end
    end
  end
end
