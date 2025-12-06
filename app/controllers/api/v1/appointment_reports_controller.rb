# frozen_string_literal: true

module Api
  module V1
    class AppointmentReportsController < ApplicationController
      # GET /api/v1/appointment_reports/by_professional
      # Relatório de serviços e comissões por profissional
      def by_professional
        begin
          account = Current.account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
          end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month
          professional_id = params[:professional_id]

          appointments = account.appointments
                               .confirmed
                               .by_date_range(start_date.beginning_of_day, end_date.end_of_day)
          
          appointments = appointments.by_professional(professional_id) if professional_id.present?

          # Agrupar por profissional
          report = appointments
                   .includes(:account_user, :service, :appointment_commissions)
                   .group_by(&:account_user_id)
                   .map do |account_user_id, prof_appointments|
            account_user = prof_appointments.first&.account_user
            next unless account_user && account_user.user
            
            user = account_user.user
            total_services = prof_appointments.count || 0
            total_revenue_cents = prof_appointments.sum { |apt| apt.price_cents || 0 } || 0
            
            # Calcular comissões usando os IDs dos appointments
            appointment_ids = prof_appointments.map(&:id)
            total_commission_cents = if appointment_ids.any?
              AppointmentCommission.where(appointment_id: appointment_ids).sum(:commission_amount_cents) || 0
            else
              0
            end

            {
              professional: {
                id: account_user.id,
                name: "#{user.first_name || ''} #{user.last_name || ''}".strip.presence || user.email || 'N/A',
                email: user.email || ''
              },
              total_services: total_services,
              total_revenue: {
                cents: total_revenue_cents,
                currency: 'BRL',
                formatted: Money.new(total_revenue_cents, 'BRL').format
              },
              total_commission: {
                cents: total_commission_cents,
                currency: 'BRL',
                formatted: Money.new(total_commission_cents, 'BRL').format
              },
              pending_payout: {
                cents: total_commission_cents, # Por enquanto, assume que tudo está pendente
                currency: 'BRL',
                formatted: Money.new(total_commission_cents, 'BRL').format
              },
              appointments: prof_appointments.map do |apt|
                commission_cents = apt.appointment_commissions.sum(:commission_amount_cents) || 0
                {
                  id: apt.id,
                  service: apt.service&.name || 'N/A',
                  client: apt.client_name || 'N/A',
                  date: apt.start_time&.iso8601,
                  price: {
                    cents: apt.price_cents || 0,
                    currency: apt.price_currency || 'BRL',
                    formatted: Money.new(apt.price_cents || 0, apt.price_currency || 'BRL').format
                  },
                  commission: {
                    cents: commission_cents,
                    currency: apt.price_currency || 'BRL',
                    formatted: Money.new(commission_cents, apt.price_currency || 'BRL').format
                  }
                }
              end
            }
          end.compact

          render json: {
            period: {
              start_date: start_date.iso8601,
              end_date: end_date.iso8601
            },
            report: report
          }
        rescue => e
          Rails.logger.error "Error in appointment_reports#by_professional: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/appointment_reports/summary
      # Resumo geral de agendamentos
      def summary
        begin
          account = Current.account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
          end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month

          appointments = account.appointments
                               .by_date_range(start_date.beginning_of_day, end_date.end_of_day)

          confirmed_appointments = appointments.confirmed
          total_revenue_cents = confirmed_appointments.sum(:price_cents) || 0
          
          # Calcular comissões usando SQL direto para melhor performance
          appointment_ids = confirmed_appointments.pluck(:id)
          total_commission_cents = if appointment_ids.any?
            AppointmentCommission.where(appointment_id: appointment_ids).sum(:commission_amount_cents) || 0
          else
            0
          end

          render json: {
            period: {
              start_date: start_date.iso8601,
              end_date: end_date.iso8601
            },
            summary: {
              total_appointments: appointments.count || 0,
              confirmed: appointments.confirmed.count || 0,
              pending: appointments.pending_payment.count || 0,
              canceled: appointments.where(status: Appointment::APPOINTMENT_STATUS[:canceled]).count || 0,
              total_revenue: {
                cents: total_revenue_cents || 0,
                currency: 'BRL',
                formatted: Money.new(total_revenue_cents || 0, 'BRL').format
              },
              total_commissions: {
                cents: total_commission_cents || 0,
                currency: 'BRL',
                formatted: Money.new(total_commission_cents || 0, 'BRL').format
              },
              net_revenue: {
                cents: (total_revenue_cents || 0) - (total_commission_cents || 0),
                currency: 'BRL',
                formatted: Money.new((total_revenue_cents || 0) - (total_commission_cents || 0), 'BRL').format
              }
            }
          }
        rescue => e
          Rails.logger.error "Error in appointment_reports#summary: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end
    end
  end
end

