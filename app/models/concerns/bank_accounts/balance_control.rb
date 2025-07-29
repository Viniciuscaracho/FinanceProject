# frozen_string_literal: true

module BankAccounts
  module BalanceControl
    extend ActiveSupport::Concern

    included do
      before_create :update_balance_before_create
    end

    def update_balance!
      without_auditing { update(balance_cents: recalculate_balance_cents) }
    end

    def month_balance_preview(current_month:)
      Money.from_cents(month_balance_preview_cents(current_month:))
    end

    def month_balance_preview_cents(current_month:)
      [
        initial_balance_cents,
        sum_transactions(date: current_month.beginning_of_month),
        sum_transactions(current_month:)
      ].inject(0, :+)
    end

    def previous_balance(date:, paid: true)
      Money.from_cents(previous_balance_cents(date:, paid:))
    end

    def previous_balance_cents(date:, paid: true, cost_center_ids: nil)
      initial_balance_cents + sum_transactions(paid:, date:, cost_center_ids:)
    end

    protected

    def update_balance_before_create
      self.balance_cents = initial_balance_cents
    end

    def recalculate_balance_cents
      initial_balance_cents + sum_transactions(paid: true)
    end

    def sum_base_query
      account.transactions.only_simple_and_children
    end

    def sum_credits(paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      query = sum_base_query.credits_by_bank_account(self)
      query = sum_base_filter(query:, paid:, current_month:, date:, cost_center_ids:)
      query.sum(:exchanged_amount_cents)
    end

    def sum_debits(paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      query = sum_base_query.debits_by_bank_account(self)
      query = sum_base_filter(query:, paid:, current_month:, date:, cost_center_ids:)
      query.sum(:exchanged_amount_cents)
    end

    def sum_base_filter(query:, paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      query = query.where(paid:)                             if paid.present?
      query = query.where(due_date: current_month.all_month) if current_month.present?
      query = query.where('due_date < ?', date)              if date.present?

      if cost_center_ids.present? && cost_center_ids.reject(&:blank?).any?
        query = query.where(cost_center: cost_center_ids.map { |i| i == '-1' ? nil : i })
      end

      query
    end

    # Método que soma todas as transações pagas ou não pagas
    # @param [Boolean] paid (default: true)
    # @return [Integer]
    def sum_transactions(paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      sum_credits(paid:, current_month:, date:, cost_center_ids:) - sum_debits(paid:, current_month:, date:, cost_center_ids:)
    end
  end
end
