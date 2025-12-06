# frozen_string_literal: true

module Reports
  # Relatório integrado que combina transações financeiras (agendamentos pagos)
  # com dados de agendamentos (para auditoria completa)
  class AppointmentsIntegrated < ApplicationService
    def call
      params = context.params
      account = context.account

      unless account
        context.fail!(message: 'Account não encontrado')
        return
      end

      begin
        start_date = params[:start_date]&.to_date || Date.today.beginning_of_month
        end_date = params[:end_date]&.to_date || Date.today.end_of_month
      rescue ArgumentError => e
        Rails.logger.error "Error parsing dates in AppointmentsIntegrated: #{e.message}"
        start_date = Date.today.beginning_of_month
        end_date = Date.today.end_of_month
      end

      # Otimização: usar includes para evitar N+1 queries e calcular tudo em menos queries
      appointment_transactions = account.transactions
                                       .where.not(appointment_id: nil)
                                       .where(due_date: start_date..end_date)
                                       .includes(:appointment)

      # Buscar todos os agendamentos no período (para auditoria completa)
      appointments = account.appointments
                           .where(start_time: start_date.beginning_of_day..end_date.end_of_day)
                           .includes(:financial_transaction)

      # Otimização: calcular receitas de agendamentos pagos em uma única query
      paid_revenue_cents = appointment_transactions.where(paid: true).sum(:amount_cents) || 0
      
      # Otimização: calcular receitas de agendamentos não pagos usando subquery
      paid_appointment_ids = appointment_transactions.where(paid: true).pluck(:appointment_id).compact.uniq
      unpaid_appointments = appointments.where.not(id: paid_appointment_ids.presence || [0])
      unpaid_revenue_cents = unpaid_appointments.sum(:price_cents) || 0

      # Calcular receitas de agendamentos cancelados
      canceled_appointments = appointments.where(status: Appointment::APPOINTMENT_STATUS[:canceled])
      canceled_revenue_cents = canceled_appointments.sum(:price_cents) || 0

      # Total de receitas esperadas (todos os agendamentos criados)
      total_expected_revenue_cents = appointments.sum(:price_cents) || 0

      # Receitas realizadas (apenas pagas)
      total_realized_revenue_cents = paid_revenue_cents

      # Receitas pendentes (não pagas e não canceladas)
      pending_revenue_cents = [unpaid_revenue_cents - canceled_revenue_cents, 0].max

      # Taxa de conversão (receitas pagas / receitas esperadas)
      conversion_rate = total_expected_revenue_cents > 0 ? 
        (total_realized_revenue_cents.to_f / total_expected_revenue_cents * 100).round(2) : 0

      # Agrupar por período (dia ou mês)
      period_type = (end_date - start_date).to_i > 31 ? :month : :day
      
      # Dados por período
      period_data = build_period_data(
        appointments: appointments,
        appointment_transactions: appointment_transactions,
        start_date: start_date,
        end_date: end_date,
        period_type: period_type
      )

      context.result = {
        period: {
          start_date: start_date.iso8601,
          end_date: end_date.iso8601
        },
        summary: {
          total_appointments: appointments.count || 0,
          paid_appointments: appointment_transactions.where(paid: true).count || 0,
          unpaid_appointments: unpaid_appointments.count || 0,
          canceled_appointments: canceled_appointments.count || 0,
          total_expected_revenue: {
            cents: total_expected_revenue_cents,
            currency: 'BRL',
            formatted: Money.new(total_expected_revenue_cents, 'BRL').format
          },
          total_realized_revenue: {
            cents: total_realized_revenue_cents,
            currency: 'BRL',
            formatted: Money.new(total_realized_revenue_cents, 'BRL').format
          },
          pending_revenue: {
            cents: pending_revenue_cents,
            currency: 'BRL',
            formatted: Money.new(pending_revenue_cents, 'BRL').format
          },
          canceled_revenue: {
            cents: canceled_revenue_cents,
            currency: 'BRL',
            formatted: Money.new(canceled_revenue_cents, 'BRL').format
          },
          conversion_rate: conversion_rate,
          net_revenue: {
            cents: total_realized_revenue_cents,
            currency: 'BRL',
            formatted: Money.new(total_realized_revenue_cents, 'BRL').format
          }
        },
        period_data: period_data,
        chart_data: build_chart_data(period_data)
      }
    rescue => e
      Rails.logger.error "Error in AppointmentsIntegrated#call: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      context.fail!(message: "Erro ao gerar relatório: #{e.message}")
    end

    private

    def build_period_data(appointments:, appointment_transactions:, start_date:, end_date:, period_type:)
      data = {}

      # Inicializar todos os períodos com zero
      if period_type == :month
        (start_date..end_date).select { |d| d.day == 1 }.each do |date|
          key = date.strftime('%m/%Y')
          data[key] = {
            expected: 0,
            paid: 0,
            unpaid: 0,
            canceled: 0
          }
        end
      else
        (start_date..end_date).each do |date|
          key = date.strftime('%d/%m/%Y')
          data[key] = {
            expected: 0,
            paid: 0,
            unpaid: 0,
            canceled: 0
          }
        end
      end

      # Otimização: usar group_by e sum em vez de iterar cada agendamento
      # Agrupar por período e status
      appointments_by_period = appointments.group_by do |apt|
        period_type == :month ? 
          apt.start_time.strftime('%m/%Y') : 
          apt.start_time.to_date.strftime('%d/%m/%Y')
      end
      
      appointments_by_period.each do |key, apts|
        next unless data[key]
        
        data[key][:expected] = apts.sum(&:price_cents) || 0
        
        # Normalizar status para comparação (pode ser símbolo, string ou número)
        canceled_apts = apts.select do |a|
          status = a.status
          status == Appointment::APPOINTMENT_STATUS[:canceled] || 
          status == :canceled || 
          status == 'canceled' ||
          (status.is_a?(Integer) && status == 3)
        end
        
        paid_apts = apts.select do |a|
          payment_status = a.payment_status
          payment_status == Appointment::PAYMENT_STATUS[:paid] || 
          payment_status == :paid || 
          payment_status == 'paid' ||
          (payment_status.is_a?(Integer) && payment_status == 1)
        end
        
        unpaid_apts = apts - canceled_apts - paid_apts
        
        data[key][:canceled] = canceled_apts.sum(&:price_cents) || 0
        data[key][:paid] = paid_apts.sum(&:price_cents) || 0
        data[key][:unpaid] = unpaid_apts.sum(&:price_cents) || 0
      end

      # Converter centavos para reais
      data.transform_values do |values|
        values.transform_values { |v| v.to_f / 100 }
      end
    end

    def build_chart_data(period_data)
      periods = period_data.keys.sort
      
      {
        expected: periods.map { |p| [p, period_data[p][:expected]] }.to_h,
        paid: periods.map { |p| [p, period_data[p][:paid]] }.to_h,
        unpaid: periods.map { |p| [p, period_data[p][:unpaid]] }.to_h,
        canceled: periods.map { |p| [p, period_data[p][:canceled]] }.to_h
      }
    end
  end
end

