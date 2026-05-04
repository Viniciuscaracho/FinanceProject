# frozen_string_literal: true

module Api
  module V1
    class DashboardController < Api::V1::ApplicationController
      def index
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        txs      = Current.account.transactions.ignore_transfers
        income   = (txs.revenues.sum(:amount_cents) / 100.0 rescue 0.0)
        expenses = (txs.expenses.sum(:amount_cents) / 100.0 rescue 0.0)
        balance  = income - expenses

        recent_transactions = Current.account.transactions
          .includes(:category, :cost_center, :contact)
          .order(created_at: :desc)
          .limit(5)
          .map { |t| serialize_transaction(t) }

        statistics = {
          total_transactions: (Current.account.transactions.count rescue 0),
          total_contacts:     (Current.account.contacts.count rescue 0),
          total_categories:   (Current.account.categories.count rescue 0)
        }

        render json: {
          receitas: income,
          despesas: expenses,
          saldo: balance,
          resultado: balance,
          balance: balance,
          income: income,
          expenses: expenses,
          recent_transactions: recent_transactions,
          statistics: statistics
        }
      rescue => e
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def recent_transactions
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        render json: {
          transactions: Current.account.transactions
            .includes(:category, :cost_center, :contact)
            .order(created_at: :desc)
            .limit(10)
            .map { |t| serialize_transaction(t) }
        }
      rescue => e
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def statistics
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        txs      = Current.account.transactions.ignore_transfers
        income   = (txs.revenues.sum(:amount_cents) / 100.0 rescue 0.0)
        expenses = (txs.expenses.sum(:amount_cents) / 100.0 rescue 0.0)
        balance  = income - expenses

        render json: {
          balance: balance,
          income: income,
          expenses: expenses,
          receitas: income,
          despesas: expenses,
          saldo: balance,
          resultado: balance,
          savings_rate: calculate_savings_rate,
          monthly_growth: calculate_monthly_growth
        }
      rescue => e
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def overdue_commitments
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        commitments = Current.account.transactions
          .only_unpaid
          .where('due_date < ?', Date.current)
          .includes(:category, :cost_center, :contact)
          .order(due_date: :asc)
          .map { |t| serialize_transaction(t) }

        render json: { commitments: commitments, count: commitments.length }
      rescue => e
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def today_commitments
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        commitments = Current.account.transactions
          .only_unpaid
          .where(due_date: Date.current)
          .includes(:category, :cost_center, :contact)
          .order(created_at: :desc)
          .map { |t| serialize_transaction(t) }

        render json: { commitments: commitments, count: commitments.length }
      rescue => e
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      private

      def serialize_transaction(transaction)
        transaction.as_json(
          only: [:id, :name, :description, :amount_cents, :amount_currency, :transaction_type_cd,
                 :due_date, :paid_at, :paid, :payment_method_cd, :payment_type_cd,
                 :bank_account_id, :category_id, :cost_center_id, :contact_id, :created_at, :updated_at]
        ).merge(
          category:     transaction.category&.as_json(only: [:id, :name]),
          cost_center:  transaction.cost_center&.as_json(only: [:id, :name]),
          contact:      transaction.contact&.as_json(only: [:id, :name])
        )
      end

      def calculate_savings_rate
        txs      = Current.account.transactions.ignore_transfers
        income   = (txs.revenues.sum(:amount_cents) / 100.0 rescue 0.0)
        expenses = (txs.expenses.sum(:amount_cents) / 100.0 rescue 0.0)

        return 0 if income.zero?

        ((income - expenses) / income * 100).round(2)
      rescue
        0
      end

      def calculate_monthly_growth
        period      = Time.current.beginning_of_month..Time.current.end_of_month
        last_period = 1.month.ago.beginning_of_month..1.month.ago.end_of_month

        current_income = (Current.account.transactions.revenues.where(due_date: period).sum(:amount_cents) / 100.0 rescue 0.0)
        last_income    = (Current.account.transactions.revenues.where(due_date: last_period).sum(:amount_cents) / 100.0 rescue 0.0)

        return 0 if last_income.zero?

        ((current_income - last_income) / last_income * 100).round(2)
      rescue
        0
      end
    end
  end
end
