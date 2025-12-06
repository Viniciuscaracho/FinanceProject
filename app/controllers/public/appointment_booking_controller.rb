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
      appointment_link = AppointmentLink.find_by(token: params[:token], active: true)
      
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
      Rails.logger.info "🔍 PublicAppointmentBooking#create called"
      Rails.logger.info "  Token: #{params[:token]}"
      Rails.logger.info "  Params: #{params.inspect}"
      Rails.logger.info "  Request format: #{request.format}"
      Rails.logger.info "  Content-Type: #{request.content_type}"
      
      appointment_link = AppointmentLink.find_by(token: params[:token], active: true)
      
      unless appointment_link
        Rails.logger.warn "❌ Appointment link not found or inactive for token: #{params[:token]}"
        render json: { error: 'Link de agendamento não encontrado ou inativo' }, status: :not_found
        return
      end
      
      Rails.logger.info "✅ Found appointment link for account: #{appointment_link.account_id}"
      
      account = appointment_link.account
      Current.account = account
      
      appointment_params_data = appointment_params
      
      # Extrair client_name e client_email antes de passar para o appointment
      # (esses campos não existem no modelo Appointment)
      client_name = appointment_params_data.delete(:client_name)
      client_email = appointment_params_data.delete(:client_email)
      
      appointment_params_data[:account_id] = account.id
      
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
      
      appointment = account.appointments.build(appointment_params_data)
      appointment.status ||= :pending
      appointment.payment_status ||= :pending
      
      if appointment.save
        # Criar payment link do Stripe se configurado
        begin
          payment_link = create_stripe_payment_link(appointment, account)
          appointment.update!(
            stripe_payment_link_id: payment_link.id,
            stripe_payment_intent_id: payment_link.payment_intent
          )
          
          render json: {
            success: true,
            appointment: appointment_json(appointment),
            payment_link_url: payment_link.url
          }, status: :created
        rescue => e
          Rails.logger.error "Erro ao criar payment link: #{e.message}"
          render json: {
            success: true,
            appointment: appointment_json(appointment),
            payment_link_url: nil
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
        :whatsapp_number, :client_name, :client_email
      ).tap do |permitted|
        permitted[:start_time] = Time.zone.parse(permitted[:start_time]) if permitted[:start_time].present?
        permitted[:end_time] = Time.zone.parse(permitted[:end_time]) if permitted[:end_time].present?
      end
    end
    
    def find_or_create_contact(account, whatsapp_number, client_name = nil)
      normalized_number = whatsapp_number.gsub(/\D/, '')
      return nil if normalized_number.blank?
      
      # Buscar contato existente
      contact = nil
      account.contacts.find_each do |c|
        cell_normalized = (c.cell_phone_number || '').gsub(/\D/, '')
        phone_normalized = (c.phone_number || '').gsub(/\D/, '')
        if cell_normalized == normalized_number || phone_normalized == normalized_number
          contact = c
          break
        end
      end
      
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
          }
        } : nil,
        professional: appointment.account_user ? {
          id: appointment.account_user.id,
          name: "#{appointment.account_user.user.first_name} #{appointment.account_user.user.last_name}".strip
        } : nil,
        start_time: appointment.start_time&.iso8601,
        end_time: appointment.end_time&.iso8601,
        status: Appointment::APPOINTMENT_STATUS.key(appointment.status)&.to_s,
        company_whatsapp: whatsapp_number ? normalize_whatsapp_number(whatsapp_number) : nil,
        company_name: account.company&.name || account.company&.first_name
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

