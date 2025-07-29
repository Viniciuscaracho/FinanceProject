# frozen_string_literal: true

module Transactions
  class Search < ApplicationService
    def call
      transaction_types = Array.wrap(context.transaction_type).map(&:to_sym)
      transaction_type_cds = transaction_types.map { |type| Transaction.transaction_types[type] }

      context.query = context.account.transactions.only_parents
      context.query = context.query.where(
        transaction_type_cd: transaction_type_cds.one? ? transaction_type_cds.first : transaction_type_cds
      )

      if context.start_date.present? && context.end_date.present?
        context.query = context.query.by_due_date(start_date: context.start_date, end_date: context.end_date)
      end

      if context.payment_status_enabled
        case context.payment_status_filter&.to_sym
        when :paid
          context.query = context.query.only_paid
        when :due_today
          context.query = context.query.last_day
        when :on_time
          context.query = context.query.on_time.or(context.query.delayed).or(context.query.last_day)
        when :delayed
          context.query = context.query.delayed
        end
      end

      if transaction_types.include?(:transfer)
        context.query = context.query.select(
          <<~SQL.squish
            transactions.*,
            UPPER(COALESCE(transactions.name, ' ')) as transaction_name,
            UPPER(COALESCE(bank_accounts.name, ' ')) AS bank_account_name,
            UPPER(COALESCE(transfer_tos_transactions.name, ' ')) AS transfer_to_name
          SQL
        ).left_joins(:bank_account, :transfer_to)

        if context.bank_account.present?
          context.query = context.query.where('? IN (bank_account_id, transfer_to_id)', context.bank_account.id)
        else
          all_bank_account_ids = context.account.bank_accounts.kept.pluck(:id)
          context.query = context.query.where('bank_account_id IN (?) OR transfer_to_id IN (?)',
                                              all_bank_account_ids, all_bank_account_ids)
        end
      else
        context.query = context.query.select(
          <<~SQL.squish
            transactions.*,
            UPPER(COALESCE(transactions.name, ' ')) as transaction_name,
            UPPER(COALESCE(people.first_name, ' ')) AS contact_name,
            UPPER(COALESCE(domains.name, ' ')) AS category_name
          SQL
        ).left_joins(:contact, :category, :cost_center)
        context.query = if context.bank_account.present?
                          context.query.where(bank_account: context.bank_account)
                        else
                          context.query.where(bank_account: context.account.bank_accounts.kept)
                        end
      end

      # Search by query
      context.query = context.query.search_by_q(context.q) if context.q.present?

      if context.cost_center_enabled
        context.cost_center_id = context.cost_center_id.compact_blank
                                        .reject(&:blank?).map { |i| i == '-1' ? nil : i }

        context.query = context.query.where(cost_center_id: context.cost_center_id) unless context.cost_center_id.empty?
      end

      if context.category_enabled
        context.category_id = context.category_id.compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i }
        context.query = context.query.where(category_id: context.category_id) unless context.category_id.empty?
      end

      if context.contact_enabled
        context.contact_id = context.contact_id.compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i }
        context.query = context.query.where(contact_id: context.contact_id) unless context.contact_id.empty?
      end

      if context.value_filter_enabled
        min_value = TransactionsHelper.parse_str_to_cents(value: context.min_value_filter)
        max_value = TransactionsHelper.parse_str_to_cents(value: context.max_value_filter)

        context.query = context.query.by_value(min_value:, max_value:)

      end

      context.query = Transaction.from(context.query, :transactions)
      context.query = context.query.includes(:attachments_attachments, :invoice, { taggings: :tag })

      if transaction_types.include?(:transfer)
        context.query = context.query.includes(:bank_account, :transfer_to)
      else
        context.query = context.query.includes(:bank_account) if context.bank_account.blank?
        context.query = context.query.includes(:contact, :category, :cost_center, :service)
      end
    end

    private

    def transaction_type_cd(transaction_type)
      Transaction.transaction_types[transaction_type.to_sym]
    end
  end
end
