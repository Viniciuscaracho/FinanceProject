# frozen_string_literal: true

module Api
  module V1
    module Public
      class AppointmentDataController < ActionController::API
        
        # GET /api/v1/public/appointment_data/:token/services
        def services
          Rails.logger.info "🔍 PublicAppointmentData#services called with token: #{params[:token]}"
          
          appointment_link = AppointmentLink.find_by(token: params[:token], active: true)
          unless appointment_link
            Rails.logger.warn "❌ Appointment link not found or inactive for token: #{params[:token]}"
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end
          
          account = appointment_link.account
          Rails.logger.info "✅ Found appointment link for account: #{account.id}"
          
          # Buscar todos os serviços habilitados (não descartados)
          all_services = account.services
                                .provideds
                                .where(enabled: 't')
                                .where(discarded_at: nil)
                                .order(:name)
          
          Rails.logger.info "🔍 Query details:"
          Rails.logger.info "  - Total services in account: #{account.services.count}"
          Rails.logger.info "  - Provided services: #{account.services.provideds.count}"
          Rails.logger.info "  - Enabled services: #{account.services.where(enabled: 't').count}"
          Rails.logger.info "  - Not discarded: #{account.services.where(discarded_at: nil).count}"
          Rails.logger.info "  - Final filtered count: #{all_services.count}"
          
          # Se o link tem um service_id específico, tentar filtrar por ele
          if appointment_link.service_id.present?
            specific_service = all_services.find_by(id: appointment_link.service_id)
            if specific_service
              # Serviço específico existe e está habilitado
              services = [specific_service]
              Rails.logger.info "📋 Using specific service: #{specific_service.id} - #{specific_service.name}"
            else
              # Serviço específico não existe ou está desabilitado, usar todos como fallback
              services = all_services
              Rails.logger.warn "⚠️ Specific service #{appointment_link.service_id} not found or disabled, showing all services"
            end
          else
            # Link não tem serviço específico, mostrar todos
            services = all_services
            Rails.logger.info "📋 No specific service configured, showing all services"
          end
          
          Rails.logger.info "📋 Found #{services.count} services"
          
          # Sempre retornar um array, mesmo que vazio
          # O frontend tratará o caso de array vazio
          render json: services.map { |s| service_json(s) }
        rescue => e
          Rails.logger.error "❌ Error in services: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
        
        # GET /api/v1/public/appointment_data/:token/professionals
        def professionals
          Rails.logger.info "🔍 PublicAppointmentData#professionals called with token: #{params[:token]}"
          
          appointment_link = AppointmentLink.find_by(token: params[:token], active: true)
          unless appointment_link
            Rails.logger.warn "❌ Appointment link not found or inactive for token: #{params[:token]}"
            render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
            return
          end
          
          account = appointment_link.account
          Rails.logger.info "✅ Found appointment link for account: #{account.id}"
          
          professionals = account.account_users.includes(:user).order('users.first_name')
          professionals = professionals.where(id: appointment_link.account_user_id) if appointment_link.account_user_id
          
          Rails.logger.info "👥 Found #{professionals.count} professionals"
          render json: professionals.map { |au| professional_json(au) }
        rescue => e
          Rails.logger.error "❌ Error in professionals: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
        
        # GET /api/v1/public/appointment_data/:token/available_slots
        # Parâmetros: professional_id, date, service_id
        def available_slots
          appointment_link = AppointmentLink.find_by(token: params[:token], active: true)
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
          
          # Gerar slots
          available_slots = []
          current_time = date.beginning_of_day + start_hour.hours
          
          Rails.logger.info "Generating slots for professional_id=#{professional_id}, date=#{date}, start_hour=#{start_hour}, end_hour=#{end_hour}, slot_interval=#{slot_interval}, slot_duration=#{slot_duration}"
          
          while current_time < date.beginning_of_day + end_hour.hours
            slot_end = current_time + slot_duration.minutes
            break if slot_end > date.beginning_of_day + end_hour.hours
            
            # Verificar se há conflito com agendamentos existentes
            # Um slot conflita se há um agendamento que:
            # - Começa antes do fim do slot E termina depois do início do slot
            conflicting = Appointment
                          .where(account_id: account.id)
                          .where(account_user_id: professional_id)
                          .where.not(status: Appointment::APPOINTMENT_STATUS[:canceled])
                          .where('(start_time < ? AND end_time > ?)', slot_end, current_time)
                          .exists?
            
            if !conflicting
              available_slots << {
                start_time: current_time.iso8601,
                end_time: slot_end.iso8601,
                formatted_time: current_time.strftime('%H:%M'),
                formatted_date: date.strftime('%d/%m/%Y')
              }
            end
            
            current_time += slot_interval.minutes
          end
          
          Rails.logger.info "Generated #{available_slots.count} available slots"
          
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
        
        private
        
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
            duration_minutes: service.metadata&.dig('duration_minutes')&.to_i || 60
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
      end
    end
  end
end

