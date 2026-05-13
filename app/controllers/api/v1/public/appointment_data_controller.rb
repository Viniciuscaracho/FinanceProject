# frozen_string_literal: true

module Api
  module V1
    module Public
      class AppointmentDataController < ActionController::API

        def services
          appointment_link = find_appointment_link
          return render json: { error: 'Link de agendamento não encontrado' }, status: :not_found unless appointment_link

          all_services = appointment_link.account.services
                                         .provideds
                                         .where(enabled: 't', discarded_at: nil)
                                         .order(:name)

          services = if appointment_link.service_id.present?
            specific = all_services.find_by(id: appointment_link.service_id)
            specific ? [specific] : all_services.to_a
          else
            all_services.to_a
          end

          render json: services.map { |s| service_json(s) }
        rescue => e
          render json: { error: e.message }, status: :internal_server_error
        end

        def professionals
          appointment_link = find_appointment_link
          return render json: { error: 'Link de agendamento não encontrado' }, status: :not_found unless appointment_link

          query = appointment_link.account.account_users.includes(:user).order('users.first_name')
          query = query.where(id: appointment_link.account_user_id) if appointment_link.account_user_id

          render json: query.to_a.map { |au| professional_json(au) }
        rescue => e
          render json: { error: e.message }, status: :internal_server_error
        end

        def available_slots
          appointment_link = find_appointment_link
          return render json: { error: 'Link de agendamento não encontrado' }, status: :not_found unless appointment_link

          account         = appointment_link.account
          professional_id = params[:professional_id] || appointment_link.account_user_id
          date            = params[:date] ? Date.parse(params[:date]) : Date.today
          service_id      = params[:service_id] || appointment_link.service_id

          return render json: { error: 'Profissional é obrigatório' }, status: :bad_request unless professional_id

          professional = account.account_users.find_by(id: professional_id)
          return render json: { error: 'Profissional não encontrado' }, status: :not_found unless professional

          service  = service_id ? account.services.find_by(id: service_id) : nil
          settings = appointment_link.settings || {}

          start_hour     = settings['start_hour']&.to_i || 9
          end_hour       = settings['end_hour']&.to_i   || 18
          slot_interval  = settings['slot_interval_minutes']&.to_i || 30
          slot_duration  = service&.metadata&.dig('duration_minutes')&.to_i ||
                           settings['default_duration_minutes']&.to_i || 60

          exclude_id = params[:exclude_appointment_id]&.to_i.presence

          cache_key = "available_slots:#{account.id}:#{professional_id}:#{date}:#{service_id}:#{exclude_id}"
          slots = begin
            Rails.cache.fetch(cache_key, expires_in: 1.minute) do
              generate_available_slots(account, professional_id, date, start_hour, end_hour, slot_interval, slot_duration, exclude_id)
            end
          rescue StandardError
            generate_available_slots(account, professional_id, date, start_hour, end_hour, slot_interval, slot_duration, exclude_id)
          end

          render json: {
            available_slots: slots,
            date:            date.iso8601,
            professional_id: professional_id,
            service_id:      service_id
          }
        rescue => e
          render json: { error: e.message }, status: :internal_server_error
        end

        def link_config
          appointment_link = find_appointment_link
          return render json: { error: 'Link de agendamento não encontrado' }, status: :not_found unless appointment_link

          render json: build_config_data(appointment_link)
        rescue => e
          render json: { error: e.message }, status: :internal_server_error
        end

        def ping
          appointment_link = find_appointment_link
          return render json: { error: 'Link de agendamento não encontrado' }, status: :not_found unless appointment_link

          render json: {
            link_id:         appointment_link.id,
            account_id:      appointment_link.account_id,
            active:          appointment_link.active,
            service_id:      appointment_link.service_id,
            account_user_id: appointment_link.account_user_id
          }
        rescue => e
          render json: { error: e.message }, status: :internal_server_error
        end

        def full
          appointment_link = find_appointment_link
          return render json: { error: 'Link de agendamento não encontrado' }, status: :not_found unless appointment_link

          account      = appointment_link.account
          all_services = account.services
                                .provideds
                                .where(enabled: 't', discarded_at: nil)
                                .order(:name)

          services = if appointment_link.service_id.present?
            specific = all_services.find_by(id: appointment_link.service_id)
            specific ? [specific] : all_services.to_a
          else
            all_services.to_a
          end

          query = account.account_users.includes(:user).order('users.first_name')
          query = query.where(id: appointment_link.account_user_id) if appointment_link.account_user_id

          render json: {
            services:      services.map { |s| service_json(s) },
            professionals: query.to_a.map { |au| professional_json(au) },
            config:        build_config_data(appointment_link),
            company:       company_json(account.company)
          }
        rescue => e
          render json: { error: e.message }, status: :internal_server_error
        end

        private

        def find_appointment_link
          AppointmentLink.find_by(token: params[:token], active: true)
        end

        def build_config_data(appointment_link)
          settings   = appointment_link.settings.presence || {}
          link_type  = settings['link_type'] || (settings['days_ahead'].to_i >= 30 ? 'premium' : 'normal')
          days_ahead = settings['days_ahead']&.to_i || (link_type == 'premium' ? 30 : 15)

          {
            link_type:           link_type,
            days_ahead:          days_ahead,
            enable_google_meet:  appointment_link.enable_google_meet || false,
            settings: {
              start_hour:               settings['start_hour']&.to_i || 9,
              end_hour:                 settings['end_hour']&.to_i   || 18,
              slot_interval_minutes:    settings['slot_interval_minutes']&.to_i    || 30,
              default_duration_minutes: settings['default_duration_minutes']&.to_i || 60
            }
          }
        end

        def generate_available_slots(account, professional_id, date, start_hour, end_hour, slot_interval, slot_duration, exclude_id = nil)
          start_time = date.beginning_of_day + start_hour.hours
          end_time   = date.beginning_of_day + end_hour.hours

          query = Appointment
            .where(account_id: account.id, account_user_id: professional_id)
            .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])
            .where('start_time < ? AND end_time > ?', end_time, start_time)
          query = query.where.not(id: exclude_id) if exclude_id

          conflicting_times = query.pluck(:start_time, :end_time)

          available_slots = []
          current_time    = start_time

          while current_time < end_time
            slot_end = current_time + slot_duration.minutes
            break if slot_end > end_time

            conflicting = conflicting_times.any? do |(appt_start, appt_end)|
              appt_start < slot_end && appt_end > current_time
            end

            unless conflicting
              available_slots << {
                start_time:     current_time.iso8601,
                end_time:       slot_end.iso8601,
                formatted_time: current_time.strftime('%H:%M'),
                formatted_date: date.strftime('%d/%m/%Y')
              }
            end

            current_time += slot_interval.minutes
          end

          available_slots
        end

        def service_json(service)
          {
            id:               service.id,
            name:             service.name,
            description:      service.description,
            price: {
              cents:     service.selling_price_cents || 0,
              currency:  service.currency || 'BRL',
              formatted: Money.new(service.selling_price_cents || 0, service.currency || 'BRL').format
            },
            duration_minutes: service.metadata&.dig('duration_minutes')&.to_i || 60,
            modality:         service.metadata&.dig('modality') || 'presencial',
            auto_meet:        service.metadata&.dig('auto_meet') == true
          }
        end

        def professional_json(account_user)
          user = account_user.user
          {
            id:    account_user.id,
            name:  "#{user.first_name} #{user.last_name}".strip,
            email: user.email
          }
        end

        def company_json(company)
          return {} unless company

          whatsapp_source = company.cell_phone_number.presence || company.phone_number.presence

          {
            id:                company.id,
            name:              company.screen_name.presence || company.name.presence || company.first_name,
            legal_name:        company.name,
            screen_name:       company.screen_name,
            phone_number:      company.phone_number,
            cell_phone_number: company.cell_phone_number,
            whatsapp_number:   whatsapp_source ? normalize_whatsapp_number(whatsapp_source) : nil,
            email:             company.email
          }
        end

        def normalize_whatsapp_number(number)
          return nil if number.blank?

          normalized = number.gsub(/\D/, '')
          return nil if normalized.blank?
          return normalized if normalized.start_with?('55')

          normalized = "55#{normalized}" if normalized.length.between?(10, 11)
          normalized
        end
      end
    end
  end
end
