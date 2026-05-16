# frozen_string_literal: true

module Api
  module V1
    class CommissionsController < ApplicationController
      def index
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        start_date      = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date        = params[:end_date]   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        professional_id = params[:professional_id]

        appointments = Current.account.appointments
                              .where(status: [Appointment::APPOINTMENT_STATUS[:confirmed], Appointment::APPOINTMENT_STATUS[:completed]])
                              .by_date_range(start_date.beginning_of_day, end_date.end_of_day)

        appointments = appointments.by_professional(professional_id) if professional_id.present?

        commissions = AppointmentCommission
                       .where(appointment_id: appointments.pluck(:id))
                       .includes(:appointment, :account_user, appointment: [:service, :contact])
                       .order(created_at: :desc)

        result = commissions.group_by(&:account_user_id).map do |_id, prof_commissions|
          account_user = prof_commissions.first.account_user
          user         = account_user.user
          total_commission_cents = prof_commissions.sum(&:commission_amount_cents)
          total_revenue_cents    = prof_commissions.sum { |c| c.appointment.price_cents || 0 }

          {
            professional: {
              id:    account_user.id,
              name:  "#{user.first_name || ''} #{user.last_name || ''}".strip.presence || user.email || 'N/A',
              email: user.email || ''
            },
            total_revenue: {
              cents:     total_revenue_cents,
              currency:  'BRL',
              formatted: Money.new(total_revenue_cents, 'BRL').format
            },
            total_commission: {
              cents:     total_commission_cents,
              currency:  'BRL',
              formatted: Money.new(total_commission_cents, 'BRL').format
            },
            commissions: prof_commissions.map do |commission|
              appointment = commission.appointment
              {
                id:             commission.id,
                appointment_id: appointment.id,
                service:        appointment.service&.name || 'N/A',
                client:         appointment.client_name  || 'N/A',
                date:           appointment.start_time&.iso8601,
                appointment_price: {
                  cents:     appointment.price_cents || 0,
                  currency:  appointment.price_currency || 'BRL',
                  formatted: Money.new(appointment.price_cents || 0, appointment.price_currency || 'BRL').format
                },
                commission_type:  commission.commission_type.to_s,
                commission_value: commission.commission_value.to_f,
                commission_amount: {
                  cents:     commission.commission_amount_cents,
                  currency:  'BRL',
                  formatted: Money.new(commission.commission_amount_cents, 'BRL').format
                },
                created_at: commission.created_at.iso8601
              }
            end
          }
        end

        total_commissions_cents = commissions.sum(&:commission_amount_cents)
        total_revenue_cents     = result.sum { |p| p[:total_revenue][:cents] }

        render json: {
          commissions: result,
          summary: {
            total_revenue: {
              cents:     total_revenue_cents,
              currency:  'BRL',
              formatted: Money.new(total_revenue_cents, 'BRL').format
            },
            total_commissions: {
              cents:     total_commissions_cents,
              currency:  'BRL',
              formatted: Money.new(total_commissions_cents, 'BRL').format
            },
            total_professionals: result.count,
            total_appointments:  appointments.count,
            period: { start_date: start_date.iso8601, end_date: end_date.iso8601 }
          }
        }
      rescue ArgumentError => e
        render json: { error: "Data inválida: #{e.message}" }, status: :bad_request
      rescue => e
        render json: {
          error:   "Erro ao processar comissões: #{e.message}",
          details: Rails.env.development? ? e.backtrace.first(5) : nil
        }, status: :internal_server_error
      end

      def summary
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        start_date      = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
        end_date        = params[:end_date]   ? Date.parse(params[:end_date])   : Date.today.end_of_month
        professional_id = params[:professional_id]

        appointments = Current.account.appointments
                              .where(status: [Appointment::APPOINTMENT_STATUS[:confirmed], Appointment::APPOINTMENT_STATUS[:completed]])
                              .by_date_range(start_date.beginning_of_day, end_date.end_of_day)

        appointments = appointments.by_professional(professional_id) if professional_id.present?

        commissions     = AppointmentCommission.where(appointment_id: appointments.pluck(:id))

        total_commissions_cents = commissions.sum(:commission_amount_cents) || 0
        total_professionals     = commissions.distinct.count(:account_user_id)

        professionals_summary = commissions
          .group(:account_user_id)
          .sum(:commission_amount_cents)
          .filter_map do |account_user_id, total_cents|
            account_user = AccountUser.find_by(id: account_user_id)
            next unless account_user&.user

            user = account_user.user
            {
              professional: {
                id:    account_user.id,
                name:  "#{user.first_name || ''} #{user.last_name || ''}".strip.presence || user.email || 'N/A',
                email: user.email || ''
              },
              total_commission: {
                cents:     total_cents,
                currency:  'BRL',
                formatted: Money.new(total_cents, 'BRL').format
              }
            }
          end

        render json: {
          summary: {
            total_commissions: {
              cents:     total_commissions_cents,
              currency:  'BRL',
              formatted: Money.new(total_commissions_cents, 'BRL').format
            },
            total_professionals: total_professionals,
            total_appointments:  appointments.count,
            professionals:       professionals_summary,
            period:              { start_date: start_date.iso8601, end_date: end_date.iso8601 }
          }
        }
      rescue ArgumentError => e
        render json: { error: "Data inválida: #{e.message}" }, status: :bad_request
      rescue => e
        render json: {
          error:   "Erro ao processar resumo de comissões: #{e.message}",
          details: Rails.env.development? ? e.backtrace.first(5) : nil
        }, status: :internal_server_error
      end
    end
  end
end
