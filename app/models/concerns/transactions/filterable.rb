# frozen_string_literal: true

# This module is responsible for the filters of the Transaction model
module Transactions
  module Filterable
    extend ActiveSupport::Concern

    included do
      def self.filter_by(**kwargs)
        transactions = apply_basic_filters
        apply_advanced_filters(transactions, kwargs)
      end

      def self.apply_basic_filters
        only_simple_and_children
      end

      def self.apply_advanced_filters(transactions, kwargs)
        transactions = apply_bank_account_filter(transactions, kwargs.fetch(:bank_account_ids, []))
        transactions = apply_cost_center_filter(transactions, kwargs.fetch(:cost_center_ids, []))
        transactions = apply_date_type_filter(transactions, kwargs)
        transactions = apply_paid_filter(transactions, kwargs.fetch(:paid, [true, false]))
        transactions = apply_tag_filter(transactions, kwargs.fetch(:tag_list, []))
        transactions = apply_category_filter(transactions, kwargs.fetch(:category_ids, []))
        apply_payment_method_filter(transactions, kwargs.fetch(:payment_methods, []))
      end

      def self.apply_bank_account_filter(transactions, bank_account_ids)
        bank_account_ids = bank_account_ids.reject(&:blank?)
        transactions = transactions.by_bank_account(bank_account_id: bank_account_ids) if bank_account_ids.any?

        transactions
      end

      def self.apply_cost_center_filter(transactions, cost_center_ids)
        cost_center_ids = cost_center_ids.reject(&:blank?).map { |i| i == '-1' ? nil : i }

        transactions = transactions.by_cost_center(cost_center_id: cost_center_ids) unless cost_center_ids.empty?

        transactions
      end

      def self.apply_date_type_filter(transactions, kwargs)
        transactions.by_date_type(
          start_date: kwargs.fetch(:start_date, Date.current.beginning_of_month).to_date,
          end_date: kwargs.fetch(:end_date, Date.current.end_of_month).to_date,
          date_type: kwargs.fetch(:date_type, :due_date)
        )
      end

      def self.apply_paid_filter(transactions, paid)
        paid_array = Array(paid)
        if paid_array.empty?
          transactions
        else
          transactions.by_paid(paid: paid_array)
        end
      end

      def self.apply_payment_method_filter(transactions, payment_methods)
        if payment_methods.any?
          payment_methods = payment_methods.map { |i| Transaction.payment_methods[i] }
          transactions = transactions.by_payment_method(payment_method: payment_methods)
        end
        transactions
      end

      def self.apply_tag_filter(transactions, tag_list)
        tag_list = tag_list.reject(&:blank?)
        if tag_list.any?
          transactions = transactions.tagged_with(tag_list, any: true)
        end
        transactions
      end

      def self.apply_category_filter(transactions, category_ids)
        category_ids = category_ids.reject(&:blank?)
        transactions = transactions.by_category(category_id: category_ids) if category_ids.any?

        transactions
      end

      def self.by_date_type(start_date:, end_date:, date_type: :due_date)
        transactions = self

        if date_type == :due_date
          transactions = transactions.by_start_date(start_date:)
          transactions = transactions.by_end_date(end_date:)
        else
          transactions = transactions.by_competency_start_date(start_date:)
          transactions = transactions.by_competency_end_date(end_date:)
        end

        transactions
      end
    end
  end
end