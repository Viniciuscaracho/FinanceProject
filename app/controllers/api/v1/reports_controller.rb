# frozen_string_literal: true

module Api
  module V1
    class ReportsController < ApplicationController
      def index
        render json: {
          reports: [
            { id: 'income_expense', name: 'Receitas vs Despesas', description: 'Análise de receitas e despesas' },
            { id: 'category_analysis', name: 'Análise por Categoria', description: 'Gastos por categoria' },
            { id: 'monthly_summary', name: 'Resumo Mensal', description: 'Resumo financeiro mensal' },
            { id: 'cash_flow', name: 'Fluxo de Caixa', description: 'Fluxo de caixa detalhado' }
          ]
        }
      end

      def show
        case params[:id]
        when 'income_expense'
          render_income_expense_report
        when 'category_analysis'
          render_category_analysis_report
        when 'monthly_summary'
          render_monthly_summary_report
        when 'cash_flow'
          render_cash_flow_report
        else
          render json: { error: 'Relatório não encontrado' }, status: :not_found
        end
      end

      private

      def render_income_expense_report
        income = Current.account.transactions.where('amount > 0').sum(:amount)
        expenses = Current.account.transactions.where('amount < 0').sum(:amount).abs

        render json: {
          report: {
            type: 'income_expense',
            data: {
              income: income,
              expenses: expenses,
              net: income - expenses,
              savings_rate: income > 0 ? ((income - expenses) / income * 100).round(2) : 0
            }
          }
        }
      end

      def render_category_analysis_report
        categories = Current.account.categories.joins(:transactions)
          .group('categories.id')
          .select('categories.*, SUM(ABS(transactions.amount)) as total_amount, COUNT(transactions.id) as transaction_count')

        render json: {
          report: {
            type: 'category_analysis',
            data: {
              categories: categories.map do |cat|
                {
                  id: cat.id,
                  name: cat.name,
                  total_amount: cat.total_amount,
                  transaction_count: cat.transaction_count
                }
              end
            }
          }
        }
      end

      def render_monthly_summary_report
        current_month = Time.current.beginning_of_month..Time.current.end_of_month
        transactions = Current.account.transactions.where(created_at: current_month)

        render json: {
          report: {
            type: 'monthly_summary',
            data: {
              month: Time.current.strftime('%B %Y'),
              total_transactions: transactions.count,
              income: transactions.where('amount > 0').sum(:amount),
              expenses: transactions.where('amount < 0').sum(:amount).abs,
              balance: transactions.sum(:amount)
            }
          }
        }
      end

      def render_cash_flow_report
        # Últimos 6 meses
        months = 6.times.map { |i| i.months.ago.beginning_of_month..i.months.ago.end_of_month }

        cash_flow = months.map do |month_range|
          transactions = Current.account.transactions.where(created_at: month_range)
          {
            month: month_range.first.strftime('%B %Y'),
            income: transactions.where('amount > 0').sum(:amount),
            expenses: transactions.where('amount < 0').sum(:amount).abs,
            balance: transactions.sum(:amount)
          }
        end

        render json: {
          report: {
            type: 'cash_flow',
            data: {
              cash_flow: cash_flow
            }
          }
        }
      end
    end
  end
end 