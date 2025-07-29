# frozen_string_literal: true

module Transactions
  class UpdateTsvBodySubscriber < ApplicationSubscriber
    on_publish :bank_account_updated, :contact_updated, :category_updated, :cost_center_updated

    def on_bank_account_updated(event)
      bank_account = event.payload.fetch(:record)
      return unless bank_account.name_previously_changed?

      UpdateTransactionsTsvBodyJob.perform_later(bank_account.account_id, :bank_account_id, bank_account.id)
      UpdateTransactionsTsvBodyJob.perform_later(bank_account.account_id, :transfer_to_id,  bank_account.id)
    end

    def on_contact_updated(event)
      contact = event.payload.fetch(:record)
      return unless contact.first_name_previously_changed? || contact.last_name_previously_changed?

      UpdateTransactionsTsvBodyJob.perform_later(contact.account_id, :contact_id, contact.id)
    end

    def on_category_updated(event)
      category = event.payload.fetch(:record)
      return unless category.name_previously_changed?

      UpdateTransactionsTsvBodyJob.perform_later(category.account_id, :category_id, category.id)
    end

    def on_cost_center_updated(event)
      cost_center = event.payload.fetch(:record)
      return unless cost_center.name_previously_changed?

      UpdateTransactionsTsvBodyJob.perform_later(cost_center.account_id, :cost_center_id, cost_center.id)
    end
  end
end
