# frozen_string_literal: true

module Invoices
  class Totalize < ApplicationService
    def call
      context.query = context.account.invoices
      context.query = context.query.search_by_tsv_body(context.q) if context.q.present?
      context.query = context.query.where(due_date: context.current_period)
      context.query = context.query.where(bank_account_id: context.current_bank_account_ids) if context.current_bank_account_ids&.any?
      context.query = context.query.where(recipient_id: context.current_contact_ids) if context.current_contact_ids&.any?
      context.query = context.query.where(status: context.current_statuses) if context.current_statuses&.any?
      context.query = context.query.group(:status).sum(:total_cents)
    end
  end
end
