# frozen_string_literal: true

module Invoices
  class Search < ApplicationService
    def call
      context.query = context.account.invoices.select("invoices.*, UPPER(COALESCE(people.first_name, ' ')) AS recipient_name")
      context.query = context.query.joins("left join people on people.id = invoices.recipient_id and people.account_id = invoices.account_id and people.type = 'Contact'")
      context.query = context.query.search_by_tsv_body(context.q) if context.q.present?
      context.query = context.query.where(due_date: context.current_period)
      context.query = context.query.where(bank_account_id: context.current_bank_account_ids) if context.current_bank_account_ids&.any?
      context.query = context.query.where(recipient_id: context.current_contact_ids) if context.current_contact_ids&.any?
      context.query = context.query.where(status: context.current_statuses) if context.current_statuses&.any?
      context.query = Invoice.from(context.query, :invoices)
    end
  end
end
