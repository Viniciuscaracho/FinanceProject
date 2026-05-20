# frozen_string_literal: true

module Api
  module V1
    class ReportsController < ApplicationController
      def index
        render json: {
          reports: [
            { id: 'income_expense', name: 'Receitas vs Despesas', description: 'Análise de receitas e despesas', category: 'geral' },
            { id: 'category_analysis', name: 'Análise por Categoria', description: 'Gastos por categoria', category: 'geral' },
            { id: 'monthly_summary', name: 'Resumo Mensal', description: 'Resumo financeiro mensal', category: 'geral' },
            { id: 'cash_flow', name: 'Fluxo de Caixa', description: 'Fluxo de caixa detalhado', category: 'geral' },
            { id: 'dre', name: 'DRE - Demonstração de Resultados', description: 'Demonstração de Resultados do Exercício', category: 'contabil' },
            { id: 'extract', name: 'Extrato Bancário', description: 'Extrato completo de movimentações', category: 'contabil' },
            { id: 'financial_history', name: 'Histórico Financeiro', description: 'Evolução de receitas e despesas ao longo do tempo', category: 'contabil' },
            { id: 'per_category', name: 'Por Categoria', description: 'Análise de despesas/receitas por categoria', category: 'analise' },
            { id: 'per_description', name: 'Por Descrição', description: 'Análise de despesas/receitas por descrição', category: 'analise' },
            { id: 'per_period', name: 'Por Período', description: 'Análise de despesas/receitas por período', category: 'analise' },
            { id: 'appointments_integrated', name: 'Relatório de Agendamentos Integrado', description: 'Análise completa de agendamentos com auditoria', category: 'agendamentos' },
            { id: 'financial_with_appointments', name: 'Relatório Financeiro Completo', description: 'Relatório financeiro incluindo receitas de agendamentos', category: 'agendamentos' }
          ]
        }
      end

      def show
        return render json: { error: 'Conta não encontrada. Faça login novamente.' }, status: :unauthorized unless Current.account

        case params[:id]
        when 'income_expense'
          render_income_expense_report
        when 'category_analysis'
          render_category_analysis_report
        when 'monthly_summary'
          render_monthly_summary_report
        when 'cash_flow'
          render_cash_flow_report
        when 'appointments_integrated'
          render_appointments_integrated_report
        when 'financial_with_appointments'
          render_financial_with_appointments_report
        when 'dre'
          render_dre_report
        when 'extract'
          render_extract_report
        when 'per_category'
          render_per_category_report
        when 'per_description'
          render_per_description_report
        when 'per_period'
          render_per_period_report
        when 'financial_history'
          render_financial_history_report
        else
          render json: { error: 'Relatório não encontrado' }, status: :not_found
        end
      rescue => e
        Rails.logger.error "Error in Reports#show: #{e.class.name}: #{e.message}"
        render_internal_error(e, message: "Erro ao processar relatório")
      end

      private

      def render_income_expense_report
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "income_expense:#{start_date}:#{end_date}:#{date_type}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'income_expense'
        ) do
          date_column = date_type == :due_date ? 'due_date' : 'competency_date'

          sql_base = <<-SQL
            SELECT
              SUM(CASE WHEN transaction_type_cd = 0 THEN amount_cents ELSE 0 END) as income_cents,
              SUM(CASE WHEN transaction_type_cd BETWEEN 1 AND 4 THEN amount_cents ELSE 0 END) as expenses_cents
            FROM transactions
            WHERE account_id = ?
              AND #{date_column} >= ?
              AND #{date_column} <= ?
              AND kind_cd IN (0, 2)
              AND transaction_type_cd != 5
          SQL

          sql_params = [Current.account.id, start_date, end_date]
          if params[:paid].present?
            paid_values = params[:paid].is_a?(Array) ? params[:paid] : [params[:paid]]
            paid_bools = paid_values.map { |p| p.to_s == 'true' || p == true }
            sql_base += " AND paid IN (#{paid_bools.map { '?' }.join(', ')})"
            sql_params += paid_bools
          end

          row = ActiveRecord::Base.connection.exec_query(
            ActiveRecord::Base.sanitize_sql_array([sql_base] + sql_params)
          ).first

          income_cents   = row&.dig('income_cents')&.to_i || 0
          expenses_cents = row&.dig('expenses_cents')&.to_i || 0

          {
            income: income_cents,
            expenses: expenses_cents,
            net: income_cents - expenses_cents,
            savings_rate: income_cents > 0 ? ((income_cents - expenses_cents).to_f / income_cents * 100).round(2) : 0
          }
        end

        render json: {
          report: {
            type: 'income_expense',
            data: report_data
          }
        }
      rescue ArgumentError => e
        render_internal_error(e, message: "Data inválida", status: :bad_request)
      rescue => e
        Rails.logger.error "Error in render_income_expense_report: #{e.class.name}: #{e.message}"
        render_internal_error(e, message: "Erro ao gerar relatório de receitas vs despesas")
      end

      def render_category_analysis_report
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "category_analysis:#{start_date}:#{end_date}:#{date_type}"

        categories_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'category_analysis'
        ) do
          date_column = date_type == :due_date ? 'due_date' : 'competency_date'

          sql_stats = <<-SQL
            SELECT
              domains.name as category_name,
              transactions.category_id,
              SUM(transactions.exchanged_amount_cents) as total_amount
            FROM transactions
            LEFT JOIN domains ON domains.id = transactions.category_id
              AND domains.type = ?
              AND domains.account_id = ?
            WHERE transactions.account_id = ?
              AND transactions.#{date_column} >= ?
              AND transactions.#{date_column} <= ?
              AND transactions.kind_cd IN (0, 2)
              AND transactions.transaction_type_cd != 5
            GROUP BY domains.name, transactions.category_id
          SQL

          result_stats = ActiveRecord::Base.connection.exec_query(
            ActiveRecord::Base.sanitize_sql_array([
              sql_stats,
              'Category',
              Current.account.id,
              Current.account.id,
              start_date,
              end_date
            ])
          )

          sql_counts = <<-SQL
            SELECT
              transactions.category_id,
              COUNT(*) as transaction_count
            FROM transactions
            WHERE transactions.account_id = ?
              AND transactions.#{date_column} >= ?
              AND transactions.#{date_column} <= ?
              AND transactions.kind_cd IN (0, 2)
              AND transactions.transaction_type_cd != 5
            GROUP BY transactions.category_id
          SQL

          category_counts = ActiveRecord::Base.connection.exec_query(
            ActiveRecord::Base.sanitize_sql_array([sql_counts, Current.account.id, start_date, end_date])
          ).index_by { |row| row['category_id'] }

          category_ids   = result_stats.map { |row| row['category_id'] }.compact.uniq
          categories_map = Current.account.categories.where(id: category_ids).index_by(&:id)

          result_stats.map do |row|
            category_id   = row['category_id']
            category_name = row['category_name']
            total_amount  = row['total_amount']&.to_i || 0

            if category_name.blank? && category_id.present?
              category_name = categories_map[category_id]&.name || 'Sem categoria'
            end

            next if category_id.nil?

            {
              id: category_id,
              name: category_name || 'Sem categoria',
              total_amount: total_amount.abs.to_i,
              transaction_count: category_counts[category_id]&.dig('transaction_count')&.to_i || 0
            }
          end.compact
        end

        render json: {
          report: {
            type: 'category_analysis',
            data: {
              categories: categories_data
            }
          }
        }
      end

      def render_monthly_summary_report
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "monthly_summary:#{start_date}:#{end_date}:#{date_type}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'monthly_summary'
        ) do
          date_column = date_type == :due_date ? 'due_date' : 'competency_date'

          sql = <<-SQL
            SELECT
              COUNT(*) as total_transactions,
              SUM(CASE WHEN transaction_type_cd = 0 THEN amount_cents ELSE 0 END) as income_cents,
              SUM(CASE WHEN transaction_type_cd BETWEEN 1 AND 4 THEN amount_cents ELSE 0 END) as expenses_cents
            FROM transactions
            WHERE account_id = ?
              AND #{date_column} >= ?
              AND #{date_column} <= ?
              AND kind_cd IN (0, 2)
              AND transaction_type_cd != 5
          SQL

          row = ActiveRecord::Base.connection.exec_query(
            ActiveRecord::Base.sanitize_sql_array([sql, Current.account.id, start_date, end_date])
          ).first

          income_cents   = row&.dig('income_cents')&.to_i || 0
          expenses_cents = row&.dig('expenses_cents')&.to_i || 0

          {
            month: start_date.strftime('%B %Y'),
            total_transactions: row&.dig('total_transactions')&.to_i || 0,
            income: income_cents,
            expenses: expenses_cents,
            balance: income_cents - expenses_cents
          }
        end

        render json: {
          report: {
            type: 'monthly_summary',
            data: report_data
          }
        }
      end

      def render_cash_flow_report
        if params[:start_date].present? && params[:end_date].present?
          start_date = Date.parse(params[:start_date])
          end_date   = Date.parse(params[:end_date])
          date_type  = params[:date_type]&.to_sym || :due_date

          current = start_date.beginning_of_month
          months  = []
          while current <= end_date
            month_start = [current, start_date].max
            month_end   = [current.end_of_month, end_date].min
            months << { start: month_start, end: month_end, label: current.strftime('%B %Y') }
            current = current.next_month
          end
        else
          months = 6.times.map do |i|
            month_start = i.months.ago.beginning_of_month
            month_end   = i.months.ago.end_of_month
            { start: month_start, end: month_end, label: month_start.strftime('%B %Y') }
          end
          date_type = :due_date
        end

        cache_key = "cash_flow:#{months.first[:start]}:#{months.last[:end]}:#{date_type}"

        cash_flow = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'cash_flow'
        ) do
          overall_start = months.map { |m| m[:start] }.min
          overall_end   = months.map { |m| m[:end] }.max
          date_column   = date_type == :due_date ? 'due_date' : 'competency_date'

          sql = <<-SQL
            SELECT
              DATE_TRUNC('month', #{date_column}) as month,
              SUM(CASE WHEN transaction_type_cd = 0 THEN amount_cents ELSE 0 END) as income_cents,
              SUM(CASE WHEN transaction_type_cd BETWEEN 1 AND 4 THEN amount_cents ELSE 0 END) as expenses_cents
            FROM transactions
            WHERE account_id = ?
              AND #{date_column} >= ?
              AND #{date_column} <= ?
              AND kind_cd IN (0, 2)
              AND transaction_type_cd != 5
            GROUP BY DATE_TRUNC('month', #{date_column})
          SQL

          monthly_stats = ActiveRecord::Base.connection.exec_query(
            ActiveRecord::Base.sanitize_sql_array([sql, Current.account.id, overall_start, overall_end])
          ).index_by { |row| row['month'].to_date.beginning_of_month }

          months.map do |month_info|
            stats          = monthly_stats[month_info[:start].beginning_of_month]
            income_cents   = stats&.dig('income_cents')&.to_i || 0
            expenses_cents = stats&.dig('expenses_cents')&.to_i || 0

            {
              month: month_info[:label],
              income: income_cents,
              expenses: expenses_cents,
              balance: income_cents - expenses_cents
            }
          end
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

      def render_appointments_integrated_report
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month

        cache_key = "appointments_integrated:#{start_date}:#{end_date}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 10.minutes },
          endpoint_namespace: 'appointments_integrated'
        ) do
          result = Reports::AppointmentsIntegrated.call(
            account: Current.account,
            params: { start_date: start_date, end_date: end_date }
          )

          result.success? ? result.result : raise(StandardError, result.message || 'Erro ao gerar relatório')
        end

        render json: {
          report: {
            type: 'appointments_integrated',
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def render_financial_with_appointments_report
        start_date, end_date = parse_date_range

        cache_key = "financial_with_appointments:#{start_date}:#{end_date}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 10.minutes },
          endpoint_namespace: 'financial_with_appointments'
        ) do
          result = Reports::FinancialWithAppointments.call(
            account: Current.account,
            params: { start_date: start_date, end_date: end_date }
          )

          result.success? ? result.result : raise(StandardError, result.message || 'Erro ao gerar relatório')
        end

        render json: {
          report: {
            type: 'financial_with_appointments',
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def render_dre_report
        start_date, end_date = parse_date_range
        date_type = params[:date_type]&.to_sym || :due_date
        paid = if params[:paid].is_a?(Array)
                 params[:paid].map { |p| p.to_s == 'true' }
               elsif params[:paid].present?
                 [params[:paid].to_s == 'true']
               else
                 [true, false]
               end

        cache_key = "dre:#{start_date}:#{end_date}:#{date_type}:#{paid.map(&:to_s).sort.join(',')}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'dre'
        ) do
          result = Reports::Dre.call(
            account: Current.account,
            params: {
              start_date: start_date,
              end_date: end_date,
              date_type: date_type,
              paid: paid
            }
          )

          if result.success?
            result.result
          else
            raise StandardError, result.message || 'Erro ao gerar DRE'
          end
        end

        render json: {
          report: {
            type: 'dre',
            data: report_data
          }
        }
      rescue StandardError => e
        Rails.logger.error "Error in render_dre_report: #{e.message}"
        render json: {
          error: e.message,
          message: "Erro ao gerar relatório DRE. Verifique os logs do servidor para mais detalhes."
        }, status: :internal_server_error
      end

      def render_extract_report
        page     = params[:page]&.to_i || 1
        per_page = [params[:per_page]&.to_i || 100, 500].min

        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date
        paid = if params[:paid].is_a?(Array)
                 params[:paid].map { |p| p.to_s == 'true' }
               elsif params[:paid].present?
                 [params[:paid].to_s == 'true']
               else
                 [true, false]
               end

        bank_account_ids = params[:bank_account_ids].is_a?(Array) ? params[:bank_account_ids] : (params[:bank_account_ids].present? ? [params[:bank_account_ids]] : [])
        cost_center_ids  = params[:cost_center_ids].is_a?(Array)  ? params[:cost_center_ids]  : (params[:cost_center_ids].present?  ? [params[:cost_center_ids]]  : [])
        category_ids     = params[:category_ids].is_a?(Array)     ? params[:category_ids]     : (params[:category_ids].present?     ? [params[:category_ids]]     : [])
        tag_ids          = params[:tag_ids].is_a?(Array)          ? params[:tag_ids]          : (params[:tag_ids].present?          ? [params[:tag_ids]]          : [])
        payment_methods  = params[:payment_methods].is_a?(Array)  ? params[:payment_methods]  : (params[:payment_methods].present?  ? [params[:payment_methods]]  : [])

        cache_key = "extract:#{start_date}:#{end_date}:#{date_type}:#{paid.map(&:to_s).sort.join(',')}:#{bank_account_ids.sort.join(',')}:#{cost_center_ids.sort.join(',')}:#{category_ids.sort.join(',')}:#{tag_ids.sort.join(',')}:#{payment_methods.sort.join(',')}:#{page}:#{per_page}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 5.minutes },
          endpoint_namespace: 'extract'
        ) do
          result = Reports::Extract.call(
            account: Current.account,
            params: {
              start_date: start_date,
              end_date: end_date,
              date_type: date_type,
              paid: paid,
              bank_account_ids: bank_account_ids,
              cost_center_ids: cost_center_ids,
              category_ids: category_ids,
              tag_ids: tag_ids,
              payment_methods: payment_methods,
              page: page,
              per_page: per_page
            }
          )

          if result.success?
            items, totals = result.result
            {
              items: items,
              totals: totals,
              pagination: {
                page: page,
                per_page: per_page,
                total_items: items.is_a?(Array) ? items.length : 0,
                has_more: (items.is_a?(Array) ? items.length : 0) >= per_page
              }
            }
          else
            raise StandardError, result.message || 'Erro ao gerar extrato'
          end
        end

        render json: {
          report: {
            type: 'extract',
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def render_per_category_report
        transaction_type = params[:transaction_type] == 'revenue' ? :revenue : :expense

        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "per_category:#{transaction_type}:#{start_date}:#{end_date}:#{date_type}:#{params[:order]}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'per_category'
        ) do
          result = Reports::PerCategory.call(
            account: Current.account,
            transaction_type: transaction_type,
            params: {
              start_date: start_date,
              end_date: end_date,
              date_type: date_type,
              order: params[:order]&.to_sym
            }
          )

          if result.success?
            chart_data, items, total = result.result
            {
              chart_data: chart_data,
              items: items,
              total: {
                cents: total.cents,
                currency: total.currency.iso_code,
                formatted: total.format
              }
            }
          else
            raise StandardError, result.message || 'Erro ao gerar relatório por categoria'
          end
        end

        render json: {
          report: {
            type: 'per_category',
            transaction_type: transaction_type,
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def render_per_description_report
        transaction_type = params[:transaction_type] == 'revenue' ? :revenue : :expense

        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "per_description:#{transaction_type}:#{start_date}:#{end_date}:#{date_type}:#{params[:order]}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'per_description'
        ) do
          result = Reports::PerDescription.call(
            account: Current.account,
            transaction_type: transaction_type,
            params: {
              start_date: start_date,
              end_date: end_date,
              date_type: date_type,
              order: params[:order]&.to_sym
            }
          )

          if result.success?
            chart_data, items, total = result.result
            {
              chart_data: chart_data,
              items: items,
              total: {
                cents: total.cents,
                currency: total.currency.iso_code,
                formatted: total.format
              }
            }
          else
            raise StandardError, result.message || 'Erro ao gerar relatório por descrição'
          end
        end

        render json: {
          report: {
            type: 'per_description',
            transaction_type: transaction_type,
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def render_per_period_report
        transaction_type = params[:transaction_type] == 'revenue' ? :revenue : :expense

        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "per_period:#{transaction_type}:#{start_date}:#{end_date}:#{date_type}:#{params[:order]}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'per_period'
        ) do
          result = Reports::PerPeriod.call(
            account: Current.account,
            transaction_type: transaction_type,
            params: {
              start_date: start_date,
              end_date: end_date,
              date_type: date_type,
              order: params[:order]&.to_sym
            }
          )

          if result.success?
            items, total, same_month = result.result
            {
              items: items,
              total: {
                cents: total.cents,
                currency: total.currency.iso_code,
                formatted: total.format
              },
              same_month: same_month
            }
          else
            raise StandardError, result.message || 'Erro ao gerar relatório por período'
          end
        end

        render json: {
          report: {
            type: 'per_period',
            transaction_type: transaction_type,
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def render_financial_history_report
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        date_type  = params[:date_type]&.to_sym || :due_date

        cache_key = "financial_history:#{start_date}:#{end_date}:#{date_type}"

        report_data = fetch_from_cache(
          cache_key,
          { expires_in: 15.minutes },
          endpoint_namespace: 'financial_history'
        ) do
          result = Reports::FinancialHistory.call(
            account: Current.account,
            params: {
              start_date: start_date,
              end_date: end_date,
              date_type: date_type
            }
          )

          if result.success? && result.result
            chart_data, items, totals = result.result
            {
              chart_data: chart_data || [],
              items: items || {},
              totals: {
                revenue: {
                  cents: totals&.dig(:revenue)&.cents || 0,
                  currency: totals&.dig(:revenue)&.currency&.iso_code || 'BRL',
                  formatted: totals&.dig(:revenue)&.format || 'R$ 0,00'
                },
                expense: {
                  cents: totals&.dig(:expense)&.cents || 0,
                  currency: totals&.dig(:expense)&.currency&.iso_code || 'BRL',
                  formatted: totals&.dig(:expense)&.format || 'R$ 0,00'
                }
              }
            }
          else
            raise StandardError, result.message || 'Erro ao gerar histórico financeiro'
          end
        end

        render json: {
          report: {
            type: 'financial_history',
            data: report_data
          }
        }
      rescue StandardError => e
        render_internal_error(e)
      end

      def parse_date_range
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date   = params[:end_date].present?   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        [start_date, end_date]
      rescue ArgumentError
        [Date.today.beginning_of_month, Date.today.end_of_month]
      end
    end
  end
end
