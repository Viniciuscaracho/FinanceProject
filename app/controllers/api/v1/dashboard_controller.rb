# frozen_string_literal: true

module Api
  module V1
    class DashboardController < Api::V1::ApplicationController
      def index
        unless Current.account
          Rails.logger.error "Current.account is nil in dashboard#index"
          return render json: { error: 'Account not found' }, status: :forbidden
        end

        # Dados do dashboard
        txs = Current.account.transactions.ignore_transfers
        income   = (txs.revenues.sum(:amount_cents) / 100.0 rescue 0.0)
        expenses = (txs.expenses.sum(:amount_cents) / 100.0 rescue 0.0)
        balance  = income - expenses
        
        # Calcular recent_transactions com tratamento de erro
        recent_transactions = begin
          transactions = Current.account.transactions
            .includes(:category, :cost_center, :contact)
            .order(created_at: :desc)
            .limit(5)
          
          # Serializar com tratamento seguro de associações opcionais
          transactions.map do |transaction|
            transaction.as_json(
              only: [:id, :name, :description, :amount_cents, :amount_currency, :transaction_type_cd,
                     :due_date, :paid_at, :paid, :payment_method_cd, :payment_type_cd,
                     :bank_account_id, :category_id, :cost_center_id, :contact_id, :created_at, :updated_at]
            ).merge(
              category: transaction.category&.as_json(only: [:id, :name]),
              cost_center: transaction.cost_center&.as_json(only: [:id, :name]),
              contact: transaction.contact&.as_json(only: [:id, :name])
            )
          end
        rescue => e
          Rails.logger.error "Error serializing recent_transactions: #{e.message}"
          []
        end
        
        # Calcular statistics com tratamento de erro
        statistics = {
          total_transactions: (Current.account.transactions.count rescue 0),
          total_contacts: (Current.account.contacts.count rescue 0),
          total_categories: (Current.account.categories.count rescue 0)
        }
        
        render json: {
          receitas: income,
          despesas: expenses,
          saldo: balance,
          resultado: income - expenses,
          balance: balance,
          income: income,
          expenses: expenses,
          recent_transactions: recent_transactions,
          statistics: statistics
        }
      rescue => e
        Rails.logger.error "Error in dashboard#index: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def recent_transactions
        unless Current.account
          Rails.logger.error "Current.account is nil in dashboard#recent_transactions"
          return render json: { error: 'Account not found' }, status: :forbidden
        end

        transactions = Current.account.transactions
          .includes(:category, :cost_center, :contact)
          .order(created_at: :desc)
          .limit(10)

        # Serializar com tratamento seguro de associações opcionais
        transactions_json = transactions.map do |transaction|
          transaction.as_json(
            only: [:id, :name, :description, :amount_cents, :amount_currency, :transaction_type_cd,
                   :due_date, :paid_at, :paid, :payment_method_cd, :payment_type_cd,
                   :bank_account_id, :category_id, :cost_center_id, :contact_id, :created_at, :updated_at]
          ).merge(
            category: transaction.category&.as_json(only: [:id, :name]),
            cost_center: transaction.cost_center&.as_json(only: [:id, :name]),
            contact: transaction.contact&.as_json(only: [:id, :name])
          )
        end

        render json: {
          transactions: transactions_json
        }
      rescue => e
        Rails.logger.error "Error in dashboard#recent_transactions: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def statistics
        unless Current.account
          Rails.logger.error "Current.account is nil in dashboard#statistics"
          return render json: { error: 'Account not found' }, status: :forbidden
        end

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
          resultado: income - expenses,
          savings_rate: calculate_savings_rate,
          monthly_growth: calculate_monthly_growth
        }
      rescue => e
        Rails.logger.error "Error in dashboard#statistics: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def overdue_commitments
        unless Current.account
          Rails.logger.error "Current.account is nil in dashboard#overdue_commitments"
          return render json: { error: 'Account not found' }, status: :forbidden
        end

        # Compromissos atrasados: transações não pagas com data de vencimento no passado
        transactions = Current.account.transactions
          .only_unpaid
          .where('due_date < ?', Date.current)
          .includes(:category, :cost_center, :contact)
          .order(due_date: :asc)

        transactions_json = transactions.map do |transaction|
          transaction.as_json(
            only: [:id, :name, :description, :amount_cents, :amount_currency, :transaction_type_cd,
                   :due_date, :paid_at, :paid, :payment_method_cd, :payment_type_cd,
                   :bank_account_id, :category_id, :cost_center_id, :contact_id, :created_at, :updated_at]
          ).merge(
            category: transaction.category&.as_json(only: [:id, :name]),
            cost_center: transaction.cost_center&.as_json(only: [:id, :name]),
            contact: transaction.contact&.as_json(only: [:id, :name])
          )
        end

        render json: {
          commitments: transactions_json,
          count: transactions_json.length
        }
      rescue => e
        Rails.logger.error "Error in dashboard#overdue_commitments: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      def today_commitments
        unless Current.account
          Rails.logger.error "Current.account is nil in dashboard#today_commitments"
          return render json: { error: 'Account not found' }, status: :forbidden
        end

        # Compromissos de hoje: transações não pagas com data de vencimento hoje
        transactions = Current.account.transactions
          .only_unpaid
          .where(due_date: Date.current)
          .includes(:category, :cost_center, :contact)
          .order(created_at: :desc)

        transactions_json = transactions.map do |transaction|
          transaction.as_json(
            only: [:id, :name, :description, :amount_cents, :amount_currency, :transaction_type_cd,
                   :due_date, :paid_at, :paid, :payment_method_cd, :payment_type_cd,
                   :bank_account_id, :category_id, :cost_center_id, :contact_id, :created_at, :updated_at]
          ).merge(
            category: transaction.category&.as_json(only: [:id, :name]),
            cost_center: transaction.cost_center&.as_json(only: [:id, :name]),
            contact: transaction.contact&.as_json(only: [:id, :name])
          )
        end

        render json: {
          commitments: transactions_json,
          count: transactions_json.length
        }
      rescue => e
        Rails.logger.error "Error in dashboard#today_commitments: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Internal Server Error', message: e.message }, status: :internal_server_error
      end

      private

      def calculate_savings_rate
        txs      = Current.account.transactions.ignore_transfers
        income   = (txs.revenues.sum(:amount_cents) / 100.0 rescue 0.0)
        expenses = (txs.expenses.sum(:amount_cents) / 100.0 rescue 0.0)

        return 0 if income.zero?

        ((income - expenses) / income * 100).round(2)
      rescue => e
        Rails.logger.error "Error calculating savings_rate: #{e.message}"
        0
      end

      def calculate_monthly_growth
        period      = Time.current.beginning_of_month..Time.current.end_of_month
        last_period = 1.month.ago.beginning_of_month..1.month.ago.end_of_month

        current_income = (Current.account.transactions.revenues.where(due_date: period).sum(:amount_cents) / 100.0 rescue 0.0)
        last_income    = (Current.account.transactions.revenues.where(due_date: last_period).sum(:amount_cents) / 100.0 rescue 0.0)

        return 0 if last_income.zero?

        ((current_income - last_income) / last_income * 100).round(2)
      rescue => e
        Rails.logger.error "Error calculating monthly_growth: #{e.message}"
        0
      end
    end
  end
end 