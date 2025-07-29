module Transactions
  module ApiFilterable
    extend ActiveSupport::Concern

    class_methods do
      def api_filter_by(**kwargs)
        transactions = only_simple_and_children

        transactions = apply_bank_account_filter(transactions, kwargs.fetch(:bank_account_ids, []))
        transactions = apply_cost_center_filter(transactions, kwargs.fetch(:cost_center_ids, []))
        transactions = apply_category_filter(transactions, kwargs.fetch(:category_ids, []))
        transactions = apply_date_filter(transactions, kwargs)
        transactions = apply_transaction_type_filter(transactions, kwargs.fetch(:transaction_type, []))
        apply_paid_filter(transactions, kwargs.fetch(:paid, %w[true false]))
      end

      private

      def apply_bank_account_filter(transactions, bank_account_ids)
        bank_account_ids.reject!(&:blank?)
        bank_account_ids.any? ? transactions.by_bank_account(bank_account_id: bank_account_ids) : transactions
      end

      def apply_cost_center_filter(transactions, cost_center_ids)
        cost_center_ids.reject!(&:blank?).map! { |i| i == '-1' ? nil : i }
        cost_center_ids.any? ? transactions.by_cost_center(cost_center_id: cost_center_ids) : transactions
      end

      def apply_category_filter(transactions, category_ids)
        category_ids.reject!(&:blank?).map! { |i| i == '-1' ? nil : i }
        category_ids.any? ? transactions.by_category(category_id: category_ids) : transactions
      end

      def apply_date_filter(transactions, kwargs)
        start_date = kwargs[:start_date].present? ? kwargs[:start_date].to_date : nil
        end_date = kwargs[:end_date].present? ? kwargs[:end_date].to_date : nil
        transactions = transactions.by_start_date(start_date: start_date) if start_date
        transactions = transactions.by_end_date(end_date: end_date) if end_date
        transactions
      end

      def apply_transaction_type_filter(transactions, transaction_types)
        unless transaction_types.blank?
          transaction_types.map! { |i| Transaction.transaction_types[i.to_sym] }
          transactions.by_transaction_type(transaction_type: transaction_types)
        else
          transactions
        end
      end

      def apply_paid_filter(transactions, paid)
        transactions.by_paid(paid: paid)
      end
    end
  end
end