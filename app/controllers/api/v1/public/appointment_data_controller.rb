# frozen_string_literal: true

module Api
  module V1
    module Public
      class AppointmentDataController < ActionController::API
        
        # GET /api/v1/public/appointment_data/:token/services
        def services
          start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          Rails.logger.info "[public.services] start token=#{params[:token]}"

          appointment_link = find_appointment_link
          unless appointment_link
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end

          account = appointment_link.account

          # Buscar todos os serviços habilitados (sem cache para evitar travas)
          all_services = account.services
                                .provideds
                                .where(enabled: 't')
                                .where(discarded_at: nil)
                                .order(:name)
          services = if appointment_link.service_id.present?
                       specific_service = all_services.find_by(id: appointment_link.service_id)
                       specific_service ? [specific_service] : all_services.to_a
                     else
                       all_services.to_a
                     end
          elapsed = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000.0
          Rails.logger.info "[public.services] done token=#{params[:token]} count=#{services.size} elapsed_ms=#{elapsed.round(1)}"

          render json: services.map { |s| service_json(s) }
        rescue => e
          Rails.logger.error "❌ Error in services: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
        
        # GET /api/v1/public/appointment_data/:token/professionals
        def professionals
          appointment_link = find_appointment_link
          unless appointment_link
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end
          
          account = appointment_link.account
          
          query = account.account_users.includes(:user).order('users.first_name')
          query = query.where(id: appointment_link.account_user_id) if appointment_link.account_user_id
          professionals = query.to_a
          
          render json: professionals.map { |au| professional_json(au) }
        rescue => e
          Rails.logger.error "❌ Error in professionals: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
        
        # GET /api/v1/public/appointment_data/:token/available_slots
        # Parâmetros: professional_id, date, service_id
        def available_slots
          appointment_link = find_appointment_link
          unless appointment_link
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end
          
          account = appointment_link.account
          
          professional_id = params[:professional_id] || appointment_link.account_user_id
          date = params[:date] ? Date.parse(params[:date]) : Date.today
          service_id = params[:service_id] || appointment_link.service_id
          
          unless professional_id
            render json: { error: 'Profissional é obrigatório' }, status: :bad_request
            return
          end
          
          professional = account.account_users.find_by(id: professional_id)
          unless professional
            render json: { error: 'Profissional não encontrado' }, status: :not_found
            return
          end
          
          service = service_id ? account.services.find_by(id: service_id) : nil
          
          # Horário de funcionamento (pode vir de configurações depois)
          settings = appointment_link.settings || {}
          start_hour = settings['start_hour']&.to_i || 9
          end_hour = settings['end_hour']&.to_i || 18
          slot_interval = settings['slot_interval_minutes']&.to_i || 30
          
          slot_duration = service&.metadata&.dig('duration_minutes')&.to_i || 
                         settings['default_duration_minutes']&.to_i || 60
          
          # Gerar slots disponíveis (com cache opcional)
          available_slots = begin
            cache_key = "available_slots:#{account.id}:#{professional_id}:#{date}:#{service_id}"
            Rails.cache.fetch(cache_key, expires_in: 1.minute) do
              generate_available_slots(account, professional_id, date, start_hour, end_hour, slot_interval, slot_duration)
            end
          rescue => e
            # Fallback se cache falhar
            Rails.logger.warn "Cache error in available_slots, generating directly: #{e.message}"
            generate_available_slots(account, professional_id, date, start_hour, end_hour, slot_interval, slot_duration)
          end
          
          render json: { 
            available_slots: available_slots,
            date: date.iso8601,
            professional_id: professional_id,
            service_id: service_id
          }
        rescue => e
          Rails.logger.error "Error in available_slots: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
        
        # GET /api/v1/public/appointment_data/:token/config
        # Retorna as configurações do link de agendamento (dias à frente, tipo, etc)
        def link_config
          appointment_link = find_appointment_link
          unless appointment_link
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end

          render json: build_config_data(appointment_link)
        rescue => e
          Rails.logger.error "Error in config: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end

        # GET /api/v1/public/appointment_data/:token/ping
        def ping
          appointment_link = find_appointment_link
          unless appointment_link
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end

          render json: {
            link_id: appointment_link.id,
            account_id: appointment_link.account_id,
            active: appointment_link.active,
            service_id: appointment_link.service_id,
            account_user_id: appointment_link.account_user_id
          }
        rescue => e
          Rails.logger.error "Error in ping: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end

        # Endpoint combinado para reduzir chamadas múltiplas
        def full
          start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          Rails.logger.info "[public.full] start token=#{params[:token]}"

          appointment_link = find_appointment_link
          unless appointment_link
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end

          account = appointment_link.account

          all_services = account.services
                                .provideds
                                .where(enabled: 't')
                                .where(discarded_at: nil)
                                .order(:name)
          services = if appointment_link.service_id.present?
                       specific_service = all_services.find_by(id: appointment_link.service_id)
                       specific_service ? [specific_service] : all_services.to_a
                     else
                       all_services.to_a
                     end

          query = account.account_users.includes(:user).order('users.first_name')
          query = query.where(id: appointment_link.account_user_id) if appointment_link.account_user_id
          professionals = query.to_a

          company_data = company_json(account.company)

          render json: {
            services: services.map { |s| service_json(s) },
            professionals: professionals.map { |au| professional_json(au) },
            config: build_config_data(appointment_link),
            company: company_data
          }
          elapsed = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000.0
          Rails.logger.info "[public.full] done token=#{params[:token]} services=#{services.size} professionals=#{professionals.size} elapsed_ms=#{elapsed.round(1)}"
        rescue => e
          Rails.logger.error "Error in full: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
        
        private
        
        # Buscar AppointmentLink sem cache (evita travas/erros da store)
        def find_appointment_link
          AppointmentLink.find_by(token: params[:token], active: true)
        end

        def build_config_data(appointment_link)
          # Evitar loops/recursão: montar config em método dedicado e sem chamadas recursivas
          settings = appointment_link.settings.presence || {}

          link_type = settings['link_type'] || (settings['days_ahead'].to_i >= 30 ? 'premium' : 'normal')
          days_ahead = settings['days_ahead']&.to_i || (link_type == 'premium' ? 30 : 15)

          {
            link_type: link_type,
            days_ahead: days_ahead,
            enable_google_meet: appointment_link.enable_google_meet || false,
            settings: {
              start_hour: settings['start_hour']&.to_i || 9,
              end_hour: settings['end_hour']&.to_i || 18,
              slot_interval_minutes: settings['slot_interval_minutes']&.to_i || 30,
              default_duration_minutes: settings['default_duration_minutes']&.to_i || 60
            }
          }
        end
        
        # Gerar slots disponíveis de forma otimizada (uma query única em vez de N queries)
        def generate_available_slots(account, professional_id, date, start_hour, end_hour, slot_interval, slot_duration)
          # Buscar todos os agendamentos conflitantes de uma vez
          start_time = date.beginning_of_day + start_hour.hours
          end_time = date.beginning_of_day + end_hour.hours
          
          conflicting_appointments = Appointment
            .where(account_id: account.id)
            .where(account_user_id: professional_id)
            .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])
            .where('start_time < ? AND end_time > ?', end_time, start_time)
            .pluck(:start_time, :end_time)
          
          # Armazenar como arrays [start, end] para verificação rápida
          conflicting_times = conflicting_appointments.to_a
          
          available_slots = []
          current_time = start_time
          
          while current_time < end_time
            slot_end = current_time + slot_duration.minutes
            break if slot_end > end_time
            
            # Verificar conflito: slot conflita se há um agendamento que começa antes do fim do slot E termina depois do início do slot
            conflicting = conflicting_times.any? do |(appt_start, appt_end)|
              appt_start < slot_end && appt_end > current_time
            end
            
            unless conflicting
              available_slots << {
                start_time: current_time.iso8601,
                end_time: slot_end.iso8601,
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
            id: service.id,
            name: service.name,
            description: service.description,
            price: {
              cents: service.selling_price_cents || 0,
              currency: service.currency || 'BRL',
              formatted: Money.new(service.selling_price_cents || 0, service.currency || 'BRL').format
            },
            duration_minutes: service.metadata&.dig('duration_minutes')&.to_i || 60,
            modality: service.metadata&.dig('modality') || 'presencial',
            auto_meet: service.metadata&.dig('auto_meet') == true
          }
        end
        
        def professional_json(account_user)
          user = account_user.user
          {
            id: account_user.id,
            name: "#{user.first_name} #{user.last_name}".strip,
            email: user.email
          }
        end

        def company_json(company)
          return {} unless company

          whatsapp_source = company.cell_phone_number.presence || company.phone_number.presence

          {
            id: company.id,
            name: company.screen_name.presence || company.name.presence || company.first_name,
            legal_name: company.name,
            screen_name: company.screen_name,
            phone_number: company.phone_number,
            cell_phone_number: company.cell_phone_number,
            whatsapp_number: whatsapp_source ? normalize_whatsapp_number(whatsapp_source) : nil,
            email: company.email
          }
        end

        def normalize_whatsapp_number(number)
          return nil if number.blank?

          normalized = number.gsub(/\D/, '')
          return nil if normalized.blank?

          return normalized if normalized.start_with?('55')

          if normalized.length >= 10 && normalized.length <= 11
            normalized = "55#{normalized}"
          end

          normalized
        end
      end
    end
  end
end

