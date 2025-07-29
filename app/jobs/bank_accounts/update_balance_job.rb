# frozen_string_literal: true

module BankAccounts
  class UpdateBalanceJob < ApplicationJob
    queue_as :default

    def perform(bank_account_id)
      BankAccounts::UpdateBalance.call(bank_account_id:)
    end
  end
end

