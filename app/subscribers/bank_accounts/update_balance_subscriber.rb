# frozen_string_literal: true

module BankAccounts
  class UpdateBalanceSubscriber < ApplicationSubscriber
    on_publish :transaction_created, :transaction_updated, :transaction_deleted

    def on_transaction_created(event)
      transaction = event.payload.fetch(:record)
      return if transaction.blank? || transaction.unpaid?

      BankAccounts::UpdateBalanceJob.perform_later(transaction.bank_account_id)
      BankAccounts::UpdateBalanceJob.perform_later(transaction.transfer_to_id) if transaction.transfer?
    end

    def on_transaction_updated(event)
      transaction = event.payload.fetch(:record)
      return unless transaction_previously_changed?(transaction)

      BankAccounts::UpdateBalanceJob.perform_later(transaction.bank_account_id)
      BankAccounts::UpdateBalanceJob.perform_later(transaction.transfer_to_id) if transaction.transfer?

      BankAccounts::UpdateBalanceJob.perform_later(transaction.bank_account_id_previously_was) if transaction.bank_account_id_previously_changed?
      BankAccounts::UpdateBalanceJob.perform_later(transaction.transfer_to_id_previously_was)  if transaction.transfer_to_id_previously_changed?
    end

    def on_transaction_deleted(event)
      transaction = event.payload.fetch(:record)
      return if transaction.unpaid? || transaction.amount.zero?

      BankAccounts::UpdateBalanceJob.perform_later(transaction.bank_account_id)
      BankAccounts::UpdateBalanceJob.perform_later(transaction.transfer_to_id) if transaction.transfer?
    end

    private

    def transaction_previously_changed?(transaction)
      transaction.paid_previously_changed? ||
        transaction.amount_cents_previously_changed? ||
        transaction.paid_amount_cents_previously_changed? ||
        transaction.transaction_type_cd_previously_changed? ||
        transaction.bank_account_id_previously_changed? ||
        transaction.transfer_to_id_previously_changed?
    end

  end
end
