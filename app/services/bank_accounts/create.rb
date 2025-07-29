# frozen_string_literal: true

module BankAccounts
  class Create < ApplicationService
    def call
      ActiveRecord::Base.transaction do
        context.bank_account = context.account.bank_accounts.new(context.bank_account_params)
        dispatch_event if context.bank_account.save
        set_feedback_message
      end
    end

    private

    def dispatch_event
      # publish 'bank_account_created', bank_account: context.bank_account
    end

    def set_feedback_message
      if context.bank_account.errors.any?
        context.fail!(message: context.bank_account.errors.full_messages.first)
      else
        context.message = I18n.t('bank_accounts.create.success')
      end
    end
  end
end
