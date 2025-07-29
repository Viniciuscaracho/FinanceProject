# frozen_string_literal: true

module Statements
  class Finish < ApplicationService
    def call
      ActiveRecord::Base.transaction do
        context.statement.statement_items.find_each(&:reconcile)
        context.statement.update(state: :done)
      end

      update_balances

      add_fail_message(context.statement) if context.statement.errors.any?
    end

    private

    def update_balances
      context.statement.reload
      context.statement.bank_account.update_balance!
      bank_account_id = context.statement.bank_account_id

      # Update balances
      bank_account_target_ids = context.statement.bank_account_target_ids.uniq
      bank_account_target_ids = bank_account_target_ids.reject { |id| id == bank_account_id }
      if bank_account_target_ids.any?
        context.statement.bank_account_targets.where(id: bank_account_target_ids).find_each(&:update_balance!)
      end

      # Update balances
      bank_account_source_ids = context.statement.bank_account_source_ids.uniq
      bank_account_source_ids = bank_account_source_ids.reject { |id| id == bank_account_id }
      if bank_account_source_ids.any?
        context.statement.bank_account_sources.where(id: bank_account_source_ids).find_each(&:update_balance!)
      end

      # Update account balance
      context.account.update_balance!
    end
  end
end
