# frozen_string_literal: true

module BankAccounts
  module BalanceControl
    extend ActiveSupport::Concern

    included do
      before_create :update_balance_before_create
    end

    def update_balance!
      new_balance = recalculate_balance_cents
      Rails.logger.info "📊 [BankAccount#update_balance!] Conta ID=#{id} (#{name}): recalculando saldo"
      Rails.logger.info "📊 [BankAccount#update_balance!] initial_balance_cents=#{initial_balance_cents}, new_balance_cents=#{new_balance}, old_balance_cents=#{balance_cents}"
      
      without_auditing { update(balance_cents: new_balance) }
      
      Rails.logger.info "✅ [BankAccount#update_balance!] Conta ID=#{id} atualizada com sucesso"
    rescue => e
      Rails.logger.error "❌ [BankAccount#update_balance!] ERRO ao atualizar conta ID=#{id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise
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
      transactions_sum = sum_transactions(paid: true)
      calculated = initial_balance_cents + transactions_sum
      
      Rails.logger.debug "📊 [BankAccount#recalculate_balance_cents] Conta ID=#{id}: initial=#{initial_balance_cents}, transactions_sum=#{transactions_sum}, calculated=#{calculated}"
      
      calculated
    end

    def sum_base_query
      account.transactions.only_simple_and_children
    end

    def sum_credits(paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      query = sum_base_query.credits_by_bank_account(self)
      query = sum_base_filter(query:, paid:, current_month:, date:, cost_center_ids:)
      credits_sum = query.sum(:exchanged_amount_cents) || 0
      
      Rails.logger.debug "📈 [BankAccount#sum_credits] Conta ID=#{id}: paid=#{paid}, credits_sum=#{credits_sum}, count=#{query.count}"
      
      credits_sum
    end

    def sum_debits(paid: nil, current_month: nil, date: nil, cost_center_ids: nil)
      query = sum_base_query.debits_by_bank_account(self)
      query = sum_base_filter(query:, paid:, current_month:, date:, cost_center_ids:)
      debits_sum = query.sum(:exchanged_amount_cents) || 0
      
      Rails.logger.debug "📉 [BankAccount#sum_debits] Conta ID=#{id}: paid=#{paid}, debits_sum=#{debits_sum}, count=#{query.count}"
      
      debits_sum
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
