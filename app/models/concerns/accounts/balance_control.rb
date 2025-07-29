# frozen_string_literal: true

module Accounts
  module BalanceControl
    extend ActiveSupport::Concern

    def update_balance!
      without_auditing { update(balance_cents: bank_accounts.kept.sum(:balance_cents)) }
    end

    # this method is used for the balance preview in the dashboard
    # it's a sum of all bank accounts or a sum of the bank accounts passed as argument
    def month_balance_preview(current_month:, bank_account_ids: nil)
      Money.from_cents(month_balance_preview_cents(current_month:, bank_account_ids: (bank_account_ids || self.bank_account_ids)))
    end

    def month_balance_preview_cents(current_month:, bank_account_ids: nil)
      [
        initial_balance_cents(bank_account_ids:),
        sum_transactions(date: current_month.beginning_of_month, bank_account_ids:),
        sum_transactions(current_month:, bank_account_ids:)
      ].inject(0, :+)
    end

    def initial_balance_cents(bank_account_ids: nil)
      query = bank_accounts.kept
      query = query.where(id: bank_account_ids) if bank_account_ids.present?
      query.sum(:initial_balance_cents)
    end

    def previous_balance(paid: true, date: nil, bank_account_ids: nil, cost_center_ids: nil)
      Money.from_cents(
        previous_balance_cents(
          date:,
          paid:,
          bank_account_ids: (bank_account_ids || self.bank_account_ids),
          cost_center_ids:
        )
      )
    end

    def previous_balance_cents(date:, paid: true, bank_account_ids: nil, cost_center_ids: nil, category_ids: nil, tag_ids: nil, payment_methods: nil)
      initial_balance_cents(bank_account_ids:) + sum_transactions(paid:, date:, bank_account_ids:, cost_center_ids:, category_ids:, tag_ids:, payment_methods:)
    end

    protected

    def sum_base_query
      transactions.only_simple_and_children
    end

    def sum_credits(paid: nil, current_month: nil, date: nil, bank_account_ids: nil, cost_center_ids: nil, category_ids: nil, tag_ids: nil, payment_methods: nil)
      query = sum_base_query.credits_by_bank_account_ids(bank_account_ids)
      query = sum_base_filter(query:, paid:, current_month:, date:, cost_center_ids:)
      query = query.where(category_id: category_ids) if category_ids.present?
      query = query.tagged_with(tag_ids) if tag_ids.present?

      if payment_methods.present?
        query = query.where(payment_method_cd: payment_methods.map { |i| Transaction.payment_methods[i] })
      end
      query.sum(:exchanged_amount_cents)
    end

    def sum_debits(paid: nil, current_month: nil, date: nil, bank_account_ids: nil, cost_center_ids: nil, category_ids: nil, tag_ids: nil, payment_methods: nil)

      query = sum_base_query.debits_by_bank_account_ids(bank_account_ids)

      query = sum_base_filter(query:, paid:, current_month:, date:, cost_center_ids:)

      query = query.where(category_id: category_ids) if category_ids.present?

      query = query.tagged_with(tag_ids) if tag_ids.present?

      if payment_methods.present?
        query = query.where(payment_method_cd: payment_methods.map { |i| Transaction.payment_methods[i] })
      end
      query.sum(:exchanged_amount_cents)
    end

    def sum_base_filter(query:, paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      query = query.where(paid:) if paid.present?
      query = query.where(due_date: current_month.all_month) if current_month.present?
      query = query.where('due_date < ?', date) if date.present?

      if cost_center_ids.present? && cost_center_ids.reject(&:blank?).any?
        query = query.where(cost_center: cost_center_ids.map { |i| i == '-1' ? nil : i })
      end

      query
    end

    # Método que soma todas as transações pagas ou não pagas
    # @param [Boolean] paid (default: true)
    # @return [Integer]
    def sum_transactions(paid: nil, current_month: nil, date: nil, bank_account_ids: nil, cost_center_ids: nil, category_ids: nil, tag_ids: nil, payment_methods: nil)
      sum_credits(paid:, current_month:, date:, bank_account_ids:, cost_center_ids:, category_ids:, tag_ids:, payment_methods:) - sum_debits(paid:, current_month:, date:, bank_account_ids:, cost_center_ids:, category_ids:, tag_ids:, payment_methods:)
    end
  end
end
