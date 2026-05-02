# frozen_string_literal: true

module Reports
  class Dre < ApplicationService
    def call
      params = context.params

      begin
        # Validar que temos uma conta
        unless context.account
          raise StandardError, "Conta não encontrada"
        end

        # Validar e converter parâmetros
        start_date = params[:start_date].present? ? Date.parse(params[:start_date].to_s) : Date.today.beginning_of_month
        end_date = params[:end_date].present? ? Date.parse(params[:end_date].to_s) : Date.today.end_of_month
        date_type = params[:date_type]&.to_sym || :due_date
        paid = normalize_paid_param(params[:paid])
        
        Rails.logger.info "Generating DRE for account #{context.account.id}, period: #{start_date} to #{end_date}"

        # Construir query de forma mais simples e direta
        query = context.account.transactions
          .where(kind_cd: [0, 2]) # only_simple_and_children
          .where(date_type == :due_date ? { due_date: start_date..end_date } : { competency_date: start_date..end_date })
          .where(paid: paid)

        # Agrupar por tipo de transação e somar exchanged_amount_cents
        data = query.group(:transaction_type_cd).sum(:exchanged_amount_cents).to_h

        # Tipo 0 = Receita (mantém positivo)
        # Tipos 1-4 = Despesas (converte para negativo para usar com +)
        data = data.map { |k, v| [k, k.zero? ? v : -v] }.to_h

        gross_income    = Money.from_cents(data.fetch(0, 0), 'BRL')
        taxes           = Money.from_cents(data.fetch(4, 0), 'BRL')
        variable_expense = Money.from_cents(data.fetch(2, 0), 'BRL')
        fixed_expense   = Money.from_cents(data.fetch(1, 0), 'BRL')
        payroll         = Money.from_cents(data.fetch(3, 0), 'BRL')

        # DRE: despesas já negativas, usamos + para subtrair corretamente
        gross_profit     = gross_income + taxes
        operating_profit = gross_profit + variable_expense
        result           = operating_profit + fixed_expense + payroll

        percentage_month = CalculationsHelper.calculate_percentage(result.cents.to_f, gross_profit.cents.to_f)

        # Serializar Money objects para JSON
        serialize_money = ->(money_obj) {
          {
            cents: money_obj.cents,
            currency: money_obj.currency.iso_code || 'BRL',
            formatted: money_obj.format
          }
        }

        context.result = {
          gross_income: serialize_money.call(gross_income),
          taxes: serialize_money.call(taxes),
          variable_expense: serialize_money.call(variable_expense),
          fixed_expense: serialize_money.call(fixed_expense),
          payroll: serialize_money.call(payroll),
          gross_profit: serialize_money.call(gross_profit),
          operating_profit: serialize_money.call(operating_profit),
          result: serialize_money.call(result),
          percentage_month: percentage_month
        }
      rescue => e
        Rails.logger.error "Error in Reports::Dre: #{e.class.name}: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        context.fail!(message: "Erro ao gerar DRE: #{e.message}")
      end
    end

    private

    def normalize_paid_param(paid)
      return [true, false] if paid.nil? || paid.blank?
      
      if paid.is_a?(Array)
        paid.map { |p| p.to_s == 'true' || p == true }
      else
        [paid.to_s == 'true' || paid == true]
      end
    end
  end
end
