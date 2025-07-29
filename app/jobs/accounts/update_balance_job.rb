# frozen_string_literal: true

module Accounts
  class UpdateBalanceJob < ApplicationJob
    queue_as :default

    def perform(account_id)
      Accounts::UpdateBalance.call(account_id:)
    end
  end
end

