# frozen_string_literal: true

module Transactions
  class Reindex < ApplicationService
    def call
      account_id = context.account_id
      column = context.column
      value = context.value

      if account_id.blank? || column.blank? || value.blank?
        return context.fail!(message: I18n.t('transactions.reindex.fail'))
      end

      Transaction.where(account_id:, column => value).find_each(batch_size: 100, &:reindex)
    end
  end
end
