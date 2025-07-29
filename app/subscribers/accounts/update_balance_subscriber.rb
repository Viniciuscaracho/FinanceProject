# frozen_string_literal: true

module Accounts
  class UpdateBalanceSubscriber < ApplicationSubscriber
    on_publish :bank_account_created, :bank_account_updated, :bank_account_deleted

    def perform(event)
      bank_account = event.payload.fetch(:record)
      return if bank_account.blank?

      Accounts::UpdateBalanceJob.perform_later(bank_account.account_id)
    end
  end
end
