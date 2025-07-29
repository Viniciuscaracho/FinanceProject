# frozen_string_literal: true

module Transactions
  class Totalizer < ApplicationService
    def call
      query = context.account.transactions.only_simple_and_children.where(
        transaction_type_cd: context.transaction_type.map { |type| Transaction.transaction_types[type] }
      )

      date = Date.current
      case context.date_filter&.to_sym
      when :week
        query = query.by_due_date(start_date: date.beginning_of_week, end_date: date.end_of_week)
      when :today
        query = query.last_day
      when :range
        if context[:params]['end_date'].present?
          query = query.by_due_date(start_date: context[:params]['start_date'], end_date: context[:params]['end_date'])
        else
          query = query.by_due_date(start_date: date.beginning_of_month, end_date: date.end_of_month)
        end
      when :yesterday
        query = query.where(due_date: date.yesterday)
      else
        query = query.where(due_date: context.period)
      end

      if context.payment_status_enabled
        case context.payment_status_filter&.to_sym
        when :paid
          query = query.only_paid
        when :due_today
          query = query.last_day
        when :on_time
          query = query.on_time.or(query.delayed).or(query.last_day)
        when :delayed
          query = query.delayed
        end
      end

      if context.bank_account.present?
        query = case context.transaction_type
                when [:transfer]
                  query.where('? in (bank_account_id, transfer_to_id)', context.bank_account)
                else
                  query.where(bank_account: context.bank_account)
                end
      end

      if context.cost_center_enabled
        context.cost_center_id = context.cost_center_id.compact_blank
                                        .reject(&:blank?).map { |i| i == '-1' ? nil : i }

        query = query.where(cost_center_id: context.cost_center_id) unless context.cost_center_id.empty?
      end

      if context.category_enabled
        context.category_id = context.category_id.compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i }
        query = query.where(category_id: context.category_id) unless context.category_id.empty?
      end

      if context.contact_enabled
        context.contact_id = context.contact_id.compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i }
        query = query.where(contact_id: context.contact_id) unless context.contact_id.empty?
      end

      result = query.group(:paid).sum(:exchanged_amount_cents)
      total = Money.from_cents(query.sum(:exchanged_amount_cents))
      total_paid = Money.from_cents(result.fetch(true, 0))
      total_unpaid = Money.from_cents(result.fetch(false, 0))

      context.result = [total, total_paid, total_unpaid]
    end
  end
end
