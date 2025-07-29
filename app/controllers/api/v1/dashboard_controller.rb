# frozen_string_literal: true

module Api
  module V1
    class DashboardController < ApplicationController
      def index
        # Dados do dashboard
        balance = Current.account.transactions.sum(:amount_cents) / 100.0
        income = Current.account.transactions.where('amount_cents > 0').sum(:amount_cents) / 100.0
        expenses = Current.account.transactions.where('amount_cents < 0').sum(:amount_cents).abs / 100.0
        
        render json: {
          receitas: income,
          despesas: expenses,
          saldo: balance,
          resultado: income - expenses,
          balance: balance,
          income: income,
          expenses: expenses,
          recent_transactions: Current.account.transactions
            .includes(:category, :cost_center, :contact)
            .order(created_at: :desc)
            .limit(5)
            .as_json(include: [:category, :cost_center, :contact]),
          statistics: {
            total_transactions: Current.account.transactions.count,
            total_contacts: Current.account.contacts.count,
            total_categories: Current.account.categories.count
          }
        }
      end

      def recent_transactions
        transactions = Current.account.transactions
          .includes(:category, :cost_center, :contact)
          .order(created_at: :desc)
          .limit(10)

        render json: {
          transactions: transactions.as_json(include: [:category, :cost_center, :contact])
        }
      end

      def statistics
        balance = Current.account.transactions.sum(:amount_cents) / 100.0
        income = Current.account.transactions.where('amount_cents > 0').sum(:amount_cents) / 100.0
        expenses = Current.account.transactions.where('amount_cents < 0').sum(:amount_cents).abs / 100.0
        
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
      end

      private

      def calculate_savings_rate
        income = Current.account.transactions.where('amount_cents > 0').sum(:amount_cents) / 100.0
        expenses = Current.account.transactions.where('amount_cents < 0').sum(:amount_cents).abs / 100.0
        
        return 0 if income.zero?
        
        ((income - expenses) / income * 100).round(2)
      end

      def calculate_monthly_growth
        # Comparação com mês anterior
        current_month = Current.account.transactions.where(created_at: Time.current.beginning_of_month..Time.current.end_of_month).sum(:amount_cents) / 100.0
        last_month = Current.account.transactions.where(created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month).sum(:amount_cents) / 100.0
        
        return 0 if last_month.zero?
        
        ((current_month - last_month) / last_month * 100).round(2)
      end
    end
  end
end 