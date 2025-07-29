# frozen_string_literal: true

module Accounts
  class UpdateBalance < ApplicationService
    def call
      return if context.account_id.blank?

      Account.with_advisory_lock_by_id(context.account_id) do
        context.account = Account.find_by(id: context.account_id)
        return if context.account.blank?

        context.account.update_balance!
      end

      set_feedback_message
    end

    private

    def set_feedback_message
      if context.account.errors.any?
        context.fail!(message: context.account.errors.full_messages.first)
      else
        context.message = I18n.t('accounts.update.success')
      end
    end
  end
end
