# frozen_string_literal: true

module Reports
  # Relatório financeiro completo que integra transações gerais com receitas de agendamentos
  class FinancialWithAppointments < ApplicationService
    def call
      params = context.params
      account = context.account

      unless account
        context.fail!(message: 'Account não encontrado')
        return
      end

      begin
        # Handle both Date objects (from controller) and strings
        start_date = if params[:start_date].is_a?(Date)
                      params[:start_date]
                    elsif params[:start_date].present?
                      Date.parse(params[:start_date].to_s)
                    else
                      Date.today.beginning_of_month
                    end
        
        end_date = if params[:end_date].is_a?(Date)
                    params[:end_date]
                  elsif params[:end_date].present?
                    Date.parse(params[:end_date].to_s)
                  else
                    Date.today.end_of_month
                  end
      rescue ArgumentError => e
        Rails.logger.error "Error parsing dates in FinancialWithAppointments: #{e.message}"
        Rails.logger.error "Params received: #{params.inspect}"
        start_date = Date.today.beginning_of_month
        end_date = Date.today.end_of_month
      end

      # Otimização: calcular todas as estatísticas em uma única query usando agregações condicionais
      revenue_type = Transaction::TRANSACTION_TYPES[:revenue]
      expense_types = [
        Transaction::TRANSACTION_TYPES[:fixed_expense],
        Transaction::TRANSACTION_TYPES[:variable_expense],
        Transaction::TRANSACTION_TYPES[:payroll],
        Transaction::TRANSACTION_TYPES[:tax]
      ].compact
      
      # Garantir que temos pelo menos um tipo de despesa
      if expense_types.empty?
        Rails.logger.warn "No expense types found in TRANSACTION_TYPES, using default values"
        expense_types = [1, 2, 3, 4] # Valores padrão baseados na definição
      end
      
      # Validar que revenue_type existe
      if revenue_type.nil?
        Rails.logger.error "Revenue type not found in TRANSACTION_TYPES"
        context.fail!(message: 'Erro na configuração do sistema: tipo de receita não encontrado')
        return
      end
      
      Rails.logger.info "FinancialWithAppointments: Processing report for account #{account.id}, period: #{start_date} to #{end_date}"
      
      # Usar uma query direta na tabela transactions para evitar problemas de GROUP BY
      # Isso garante que não há joins ou selects implícitos que possam causar o erro
      stats = Transaction
        .from("transactions")
        .where(account_id: account.id)
        .where(due_date: start_date..end_date)
        .select(
          "SUM(CASE WHEN appointment_id IS NOT NULL AND paid = true AND transaction_type_cd = #{revenue_type} THEN amount_cents ELSE 0 END) as appointment_revenues_paid",
          "SUM(CASE WHEN appointment_id IS NOT NULL AND paid = false AND transaction_type_cd = #{revenue_type} THEN amount_cents ELSE 0 END) as appointment_revenues_unpaid",
          "SUM(CASE WHEN appointment_id IS NULL AND transaction_type_cd = #{revenue_type} THEN amount_cents ELSE 0 END) as other_revenues",
          "SUM(CASE WHEN transaction_type_cd IN (#{expense_types.join(',')}) THEN ABS(amount_cents) ELSE 0 END) as expenses"
        )
        .first

      # Tratar caso onde stats pode ser nil ou os valores podem ser nil
      appointment_revenues_paid = stats&.appointment_revenues_paid&.to_i || 0
      appointment_revenues_unpaid = stats&.appointment_revenues_unpaid&.to_i || 0
      other_revenues = stats&.other_revenues&.to_i || 0
      expenses = stats&.expenses&.to_i || 0

      # Total de receitas
      total_revenues = appointment_revenues_paid + other_revenues

      # Saldo líquido (expenses já vem como valor absoluto do SQL)
      net_balance = total_revenues - expenses

      # Percentual de receitas de agendamentos
      appointment_revenue_percentage = total_revenues > 0 ? 
        (appointment_revenues_paid.to_f / total_revenues * 100).round(2) : 0

      context.result = {
        period: {
          start_date: start_date.iso8601,
          end_date: end_date.iso8601
        },
        revenues: {
          from_appointments: {
            paid: {
              cents: appointment_revenues_paid,
              currency: 'BRL',
              formatted: Money.new(appointment_revenues_paid, 'BRL').format
            },
            unpaid: {
              cents: appointment_revenues_unpaid,
              currency: 'BRL',
              formatted: Money.new(appointment_revenues_unpaid, 'BRL').format
            },
            total: {
              cents: appointment_revenues_paid + appointment_revenues_unpaid,
              currency: 'BRL',
              formatted: Money.new(appointment_revenues_paid + appointment_revenues_unpaid, 'BRL').format
            }
          },
          from_other_sources: {
            cents: other_revenues,
            currency: 'BRL',
            formatted: Money.new(other_revenues, 'BRL').format
          },
          total: {
            cents: total_revenues,
            currency: 'BRL',
            formatted: Money.new(total_revenues, 'BRL').format
          }
        },
        expenses: {
          cents: expenses,
          currency: 'BRL',
          formatted: Money.new(expenses, 'BRL').format
        },
        net_balance: {
          cents: net_balance,
          currency: 'BRL',
          formatted: Money.new(net_balance, 'BRL').format
        },
        metrics: {
          appointment_revenue_percentage: appointment_revenue_percentage,
          profit_margin: total_revenues > 0 ? ((net_balance.to_f / total_revenues) * 100).round(2) : 0
        }
      }
    rescue => e
      Rails.logger.error "Error in FinancialWithAppointments#call: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      context.fail!(message: "Erro ao gerar relatório: #{e.message}")
    end
  end
end

