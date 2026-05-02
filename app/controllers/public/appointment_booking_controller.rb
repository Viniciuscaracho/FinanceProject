# frozen_string_literal: true

module Public
  class AppointmentBookingController < ApplicationController
    # Desabilitar autenticação e CSRF para rotas públicas
    skip_before_action :authenticate_user!
    skip_before_action :set_request_details
    skip_forgery_protection
    
    # Log para debug
    before_action :log_request, only: [:create]
    
    # GET /agendar/:token
    # Redireciona para o frontend React que cuida da UI
    # Esta rota só é chamada quando alguém acessa diretamente o backend (não via Vite)
    def show
      appointment_link = begin
        cache_key = "appointment_link:#{params[:token]}"
        Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
          AppointmentLink.find_by(token: params[:token], active: true)
        end
      rescue => e
        Rails.logger.warn "Cache error, fetching directly: #{e.message}"
        AppointmentLink.find_by(token: params[:token], active: true)
      end
      
      unless appointment_link
        render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
        return
      end
      
      # Redirecionar para o frontend React
      frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
      redirect_to "#{frontend_url}/agendar/#{params[:token]}", allow_other_host: true
    end
    
    # POST /agendar/:token/book
    def create
      appointment_link = begin
        cache_key = "appointment_link:#{params[:token]}"
        Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
          AppointmentLink.find_by(token: params[:token], active: true)
        end
      rescue => e
        Rails.logger.warn "Cache error, fetching directly: #{e.message}"
        AppointmentLink.find_by(token: params[:token], active: true)
      end
      
      unless appointment_link
        render json: { error: 'Link de agendamento não encontrado ou inativo' }, status: :not_found
        return
      end
      
      account = appointment_link.account
      Current.account = account
      
      appointment_params_data = appointment_params

      raw_google_meet_link = appointment_params_data[:google_meet_link].to_s.strip
      appointment_params_data[:google_meet_link] = raw_google_meet_link.presence

      raw_recurrence_pattern = params[:recurrence_pattern] || params.dig(:appointment, :recurrence_pattern)
      recurrence_pattern = sanitize_recurrence_pattern(raw_recurrence_pattern)

      if raw_recurrence_pattern.present? && recurrence_pattern.nil?
        render json: {
          success: false,
          errors: ['Padrão de recorrência inválido. Frequências permitidas: daily, weekly, biweekly, monthly, bimonthly, quarterly, semiannual, annual. Máximo de 24 ocorrências.']
        }, status: :unprocessable_entity
        return
      end
      
      # Extrair client_name e client_email antes de passar para o appointment
      # (esses campos não existem no modelo Appointment)
      client_name = appointment_params_data.delete(:client_name)
      client_email = appointment_params_data.delete(:client_email)
      
      appointment_params_data[:account_id] = account.id

      # Não salvar diretamente flags de geração de Meet/recorrência no modelo
      appointment_params_data.delete(:recurrence_pattern)
      appointment_params_data.delete(:enable_google_meet)

      if appointment_params_data[:google_meet_link].present? && !valid_google_meet_link?(appointment_params_data[:google_meet_link])
        render json: {
          success: false,
          errors: ['Link do Google Meet inválido. Utilize um link no formato https://meet.google.com/xxx-xxxx-xxx']
        }, status: :unprocessable_entity
        return
      end
      
      # Criar ou buscar contato
      # Nota: O modelo Appointment também cria contato automaticamente via callback,
      # mas fazemos aqui também para ter o nome do cliente se fornecido
      if appointment_params_data[:whatsapp_number].present?
        begin
          contact = find_or_create_contact(account, appointment_params_data[:whatsapp_number], client_name)
          appointment_params_data[:contact_id] = contact.id if contact
          
          # Atualizar email do contato se fornecido
          if client_email.present? && contact
            contact.update(email: client_email) unless contact.email.present?
          end
        rescue => e
          Rails.logger.error "Error creating/finding contact: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          # Continuar - o callback do modelo tentará criar se necessário
        end
      end
      
      # Buscar serviço para obter preço
      service = account.services.find_by(id: appointment_params_data[:service_id])
      unless service
        render json: { 
          success: false,
          errors: ['Serviço não encontrado'] 
        }, status: :unprocessable_entity
        return
      end
      
      # Calcular preço e end_time se necessário
      appointment_params_data[:price_cents] ||= service.selling_price_cents || 0
      appointment_params_data[:price_currency] ||= service.currency || 'BRL'
      
      if appointment_params_data[:end_time].blank? && appointment_params_data[:start_time].present?
        duration_minutes = service.metadata&.dig('duration_minutes')&.to_i || 60
        appointment_params_data[:end_time] = appointment_params_data[:start_time] + duration_minutes.minutes
      end

      service_metadata = service.metadata || {}
      auto_meet_enabled = service_metadata['auto_meet'] == true
      modality_online = %w[online hibrido].include?(service_metadata['modality'].to_s.downcase)

      default_generate_google_meet = ENV.fetch('PUBLIC_BOOKING_DEFAULT_GOOGLE_MEET', 'true').to_s.downcase.in?(%w[true 1 yes on])

      should_generate_google_meet = appointment_link.enable_google_meet ||
                                    truthy?(params[:enable_google_meet]) ||
                                    truthy?(params.dig(:appointment, :enable_google_meet)) ||
                                    auto_meet_enabled ||
                                    modality_online

      if !should_generate_google_meet && default_generate_google_meet
        Rails.logger.info '🔗 Gerando Google Meet por padrão (PUBLIC_BOOKING_DEFAULT_GOOGLE_MEET habilitado)'
      end
      should_generate_google_meet ||= default_generate_google_meet

      # Se o usuário já forneceu um link válido, não gere automaticamente
      should_generate_google_meet = false if appointment_params_data[:google_meet_link].present?
      
      appointment = account.appointments.build(appointment_params_data)
      appointment.status ||= :pending
      appointment.payment_status ||= :pending
      
      if appointment.save
        # Gerar link do Google Meet quando configurado
        google_meet_link = nil
        if should_generate_google_meet
          begin
            result = Appointments::GenerateGoogleMeetLink.call(appointment: appointment)
            appointment.reload
            google_meet_link = result.google_meet_link || appointment.google_meet_link
          rescue => e
            Rails.logger.error "Erro ao gerar Google Meet: #{e.message}"
          end
        end

        recurrence_summary = nil
        if recurrence_pattern.present?
          begin
            recurring_result = Appointments::CreateRecurring.call(
              parent_appointment: appointment,
              recurrence_pattern: recurrence_pattern
            )

            if recurring_result.success?
              recurrence_summary = {
                count: recurring_result.count,
                frequency: recurrence_pattern[:frequency],
                end_date: recurrence_pattern[:end_date],
                created_ids: (recurring_result.created_appointments || []).map(&:id)
              }
            else
              Rails.logger.error "Erro ao criar recorrência: #{recurring_result.error}"
            end
          rescue => e
            Rails.logger.error "Exceção ao criar recorrência: #{e.message}"
          end
        end

        # Criar payment link do Stripe se configurado
        begin
          payment_link = create_stripe_payment_link(appointment, account)
          appointment.update!(
            stripe_payment_link_id: payment_link.id,
            stripe_payment_intent_id: payment_link.payment_intent
          )
          
          render json: {
            success: true,
            appointment: appointment_json(appointment.reload),
            payment_link_url: payment_link.url,
            google_meet_link: google_meet_link || appointment.google_meet_link,
            recurrence: recurrence_summary
          }, status: :created
        rescue => e
          Rails.logger.error "Erro ao criar payment link: #{e.message}"
          render json: {
            success: true,
            appointment: appointment_json(appointment.reload),
            payment_link_url: nil,
            google_meet_link: google_meet_link || appointment.google_meet_link,
            recurrence: recurrence_summary
          }, status: :created
        end
      else
        Rails.logger.error "Failed to save appointment: #{appointment.errors.full_messages.join(', ')}"
        Rails.logger.error "Appointment attributes: #{appointment.attributes.inspect}"
        Rails.logger.error "Appointment errors: #{appointment.errors.inspect}"
        render json: { 
          success: false,
          errors: appointment.errors.full_messages 
        }, status: :unprocessable_entity
      end
    end
    
    # GET /agendamento/sucesso
    def success
      # Página de sucesso após agendamento
      render 'success', layout: 'public'
    end
    
    private
    
    def log_request
      Rails.logger.info "📥 Incoming request:"
      Rails.logger.info "  Method: #{request.method}"
      Rails.logger.info "  Path: #{request.path}"
      Rails.logger.info "  Format: #{request.format}"
      Rails.logger.info "  Content-Type: #{request.content_type}"
      Rails.logger.info "  Params keys: #{params.keys.inspect}"
    end
    
    def appointment_params
      params.require(:appointment).permit(
        :account_user_id, :service_id, :start_time, :end_time,
        :whatsapp_number, :client_name, :client_email,
        :enable_google_meet,
        :google_meet_link,
        recurrence_pattern: {}
      ).tap do |permitted|
        permitted[:start_time] = Time.zone.parse(permitted[:start_time]) if permitted[:start_time].present?
        permitted[:end_time] = Time.zone.parse(permitted[:end_time]) if permitted[:end_time].present?
      end
    end

    def valid_google_meet_link?(link)
      return false if link.blank?
      normalized = link.strip
      pattern = %r{\Ahttps://meet\.google\.com/[a-zA-Z0-9]{3}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{3}(?:\?[^\s]*)?\z}
      normalized.match?(pattern)
    end

    def sanitize_recurrence_pattern(raw_pattern)
      return nil unless raw_pattern.is_a?(ActionController::Parameters) || raw_pattern.is_a?(Hash)

      pattern = raw_pattern.to_unsafe_h if raw_pattern.respond_to?(:to_unsafe_h)
      pattern ||= raw_pattern

      frequency = pattern['frequency']&.to_s&.downcase
      occurrences = pattern['occurrences']&.to_i if pattern.key?('occurrences')
      end_date = pattern['end_date']

      allowed_frequencies = %w[daily weekly biweekly monthly bimonthly quarterly semiannual annual]
      return nil unless frequency.in?(allowed_frequencies)

      occurrences = [[occurrences || 10, 1].max, 24].min

      parsed_end_date = begin
        Date.parse(end_date) if end_date.present?
      rescue ArgumentError
        nil
      end

      {
        frequency: frequency,
        occurrences: occurrences,
        end_date: parsed_end_date&.iso8601
      }
    end

    def truthy?(value)
      value == true || value.to_s.downcase.in?(%w[true 1 yes on])
    end
    
    def find_or_create_contact(account, whatsapp_number, client_name = nil)
      normalized_number = whatsapp_number.gsub(/\D/, '')
      return nil if normalized_number.blank?
      
      # Buscar contato existente usando query otimizada
      contact = account.contacts
        .where("REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(cell_phone_number, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ? OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(phone_number, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ?", normalized_number, normalized_number)
        .first
      
      # Criar novo contato se não existir
      if contact.nil?
        name = client_name.presence || "Cliente #{whatsapp_number}"
        contact = account.contacts.build(
          first_name: name.split(' ').first,
          last_name: name.split(' ')[1..-1]&.join(' '),
          cell_phone_number: normalized_number,
          contact_type_cd: Contact::CONTACT_TYPES[:customer]
        )
        contact.save!
      elsif client_name.present? && contact.first_name != client_name.split(' ').first
        # Atualizar nome se fornecido e diferente
        contact.update!(
          first_name: client_name.split(' ').first,
          last_name: client_name.split(' ')[1..-1]&.join(' ')
        )
      end
      
      contact
    end
    
    def create_stripe_payment_link(appointment, account)
      return nil unless defined?(Stripe)
      
      # Buscar ou criar customer no Stripe
      customer_id = account.processor_customer_id
      unless customer_id
        customer = Stripe::Customer.create(
          email: appointment.contact&.email || "cliente+#{appointment.whatsapp_number}@example.com",
          metadata: {
            account_id: account.id,
            appointment_id: appointment.id,
            whatsapp_number: appointment.whatsapp_number
          }
        )
        customer_id = customer.id
        account.update(processor_customer_id: customer_id)
      end
      
      service = appointment.service
      product_name = "#{service.name} - #{appointment.start_time.strftime('%d/%m/%Y %H:%M')}"
      
      # Criar Payment Link
      Stripe::PaymentLink.create(
        line_items: [{
          price_data: {
            currency: appointment.price_currency.downcase,
            product_data: {
              name: product_name,
              description: "Agendamento: #{service.name}"
            },
            unit_amount: appointment.price_cents
          },
          quantity: 1
        }],
        metadata: {
          appointment_id: appointment.id.to_s,
          account_id: account.id.to_s,
          whatsapp_number: appointment.whatsapp_number
        },
        after_completion: {
          type: 'redirect',
          redirect: {
            url: "#{ENV.fetch('DEFAULT_HOST_NAME', 'http://localhost:3000')}/agendamento/sucesso"
          }
        }
      )
    end
    
    def appointment_json(appointment)
      account = appointment.account
      # Priorizar cell_phone_number (celular) sobre phone_number (fixo)
      whatsapp_number = account.company&.cell_phone_number.presence || account.company&.phone_number.presence
      
      Rails.logger.info "📱 WhatsApp number lookup for account #{account.id}:"
      Rails.logger.info "  - company exists: #{account.company.present?}"
      Rails.logger.info "  - phone_number: #{account.company&.phone_number.inspect}"
      Rails.logger.info "  - cell_phone_number: #{account.company&.cell_phone_number.inspect}"
      Rails.logger.info "  - selected: #{whatsapp_number.inspect}"
      
      normalized_whatsapp = whatsapp_number ? normalize_whatsapp_number(whatsapp_number) : nil
      Rails.logger.info "  - normalized: #{normalized_whatsapp.inspect}"
      
      {
        id: appointment.id,
        service: appointment.service ? {
          id: appointment.service.id,
          name: appointment.service.name,
          price: {
            cents: appointment.service.selling_price_cents || 0,
            currency: appointment.service.currency || 'BRL',
            formatted: Money.new(appointment.service.selling_price_cents || 0, appointment.service.currency || 'BRL').format
          },
          metadata: appointment.service.metadata || {}
        } : nil,
        professional: appointment.account_user ? {
          id: appointment.account_user.id,
          name: "#{appointment.account_user.user.first_name} #{appointment.account_user.user.last_name}".strip
        } : nil,
        start_time: appointment.start_time&.iso8601,
        end_time: appointment.end_time&.iso8601,
        status: Appointment::APPOINTMENT_STATUS.key(appointment.status)&.to_s,
        company_whatsapp: whatsapp_number ? normalize_whatsapp_number(whatsapp_number) : nil,
        company_name: account.company&.name || account.company&.first_name,
        google_meet_link: appointment.google_meet_link,
        has_google_meet: appointment.google_meet_link.present?,
        recurrence_pattern: appointment.recurrence_pattern,
        recurring: appointment.recurrence_pattern.present?,
        parent_appointment_id: appointment.parent_appointment_id
      }
    end
    
    def normalize_whatsapp_number(number)
      return nil if number.blank?
      
      # Remove todos os caracteres não numéricos
      normalized = number.gsub(/\D/, '')
      return nil if normalized.blank?
      
      # Se já começar com 55, retornar como está
      return normalized if normalized.start_with?('55')
      
      # Se tiver 10 ou 11 dígitos (número brasileiro sem código do país), adicionar 55
      if normalized.length >= 10 && normalized.length <= 11
        normalized = "55#{normalized}"
      end
      
      normalized
    end
  end
end

