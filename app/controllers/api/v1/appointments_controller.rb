# frozen_string_literal: true

module Api
  module V1
    class AppointmentsController < ApplicationController
      # Endpoint público para n8n (usa API key em vez de autenticação de usuário)
      # services e professionals devem usar autenticação de usuário normal
      skip_before_action :authenticate_user!, only: [:create, :available_slots]
      skip_before_action :set_current_account, only: [:create, :available_slots]
      before_action :authenticate_api_key, only: [:create, :available_slots]
      before_action :set_account_from_api, only: [:create, :available_slots]
      before_action :set_appointment, only: [:show, :update, :destroy, :generate_professional_document, :send_anamnese]

      def index
        account = Current.account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        appointments = account.appointments
                             .includes(:account_user, :service, :contact, :appointment_commissions, :appointment_note)
                             .order(start_time: :desc)

        if params[:status].present?
          status_val = Appointment::APPOINTMENT_STATUS[params[:status].to_sym]
          appointments = appointments.where(status: status_val) if status_val
        end
        if params[:payment_status].present?
          ps_val = Appointment::PAYMENT_STATUS[params[:payment_status].to_sym]
          appointments = appointments.where(payment_status: ps_val) if ps_val
        end
        appointments = appointments.where(account_user_id: params[:account_user_id]) if params[:account_user_id].present?
        appointments = appointments.where(contact_id: params[:contact_id]) if params[:contact_id].present?

        if params[:start_date].present? || params[:end_date].present?
          start_date = params[:start_date].present? ? Time.parse(params[:start_date]).beginning_of_day : nil
          end_date   = params[:end_date].present?   ? Time.parse(params[:end_date]).end_of_day : nil

          if start_date && end_date
            appointments = appointments.by_date_range(start_date, end_date)
          elsif start_date
            appointments = appointments.where('start_time >= ?', start_date)
          elsif end_date
            appointments = appointments.where('start_time <= ?', end_date)
          end
        end

        render json: appointments.map { |apt| appointment_json(apt) }
      rescue => e
        Rails.logger.error "appointments#index: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def services
        account = Current.account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        render json: account.services.provideds.where(enabled: 't').order(:name).map { |s| service_json(s) }
      rescue => e
        Rails.logger.error "appointments#services: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def professionals
        account = Current.account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        render json: account.account_users.includes(:user).order('users.first_name').map { |au| professional_json(au) }
      rescue => e
        Rails.logger.error "appointments#professionals: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def available_slots
        account = Current.account || @current_account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        professional_id = params[:professional_id]
        date = params[:date] ? Date.parse(params[:date]) : Date.today
        service_id = params[:service_id]

        professional = account.account_users.find_by(id: professional_id)
        return render json: { error: 'Professional not found' }, status: :not_found unless professional

        service = service_id ? account.services.find_by(id: service_id) : nil
        working_hours = professional.working_hours_for_date(date)
        return render json: { available_slots: [] } unless working_hours

        start_hour = working_hours[:start_time].hour
        end_hour = working_hours[:end_time].hour
        slot_duration = service&.metadata&.dig('duration_minutes')&.to_i || 60

        available_slots = []
        current_time = date.beginning_of_day + start_hour.hours

        while current_time < date.beginning_of_day + end_hour.hours
          slot_end = current_time + slot_duration.minutes
          break if slot_end > date.beginning_of_day + end_hour.hours

          conflicting = Appointment
                        .where(account_user_id: professional_id)
                        .where.not(status: [Appointment::APPOINTMENT_STATUS[:canceled], Appointment::APPOINTMENT_STATUS[:no_show]])
                        .where('(start_time < ? AND end_time > ?)', slot_end, current_time)
                        .exists?

          if !conflicting && professional.available_at?(current_time) && professional.available_at?(slot_end - 1.minute)
            available_slots << { start_time: current_time.iso8601, end_time: slot_end.iso8601, available: true }
          end

          current_time += 30.minutes
        end

        render json: { available_slots: available_slots }
      rescue => e
        Rails.logger.error "appointments#available_slots: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def create
        account = Current.account || @current_account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        apt_params = appointment_params

        if apt_params[:contact_id].blank? && apt_params[:whatsapp_number].present?
          contact = appointment_from_whatsapp(account, apt_params[:whatsapp_number])
          apt_params[:contact_id] = contact.id if contact
        end

        appointment = account.appointments.build(apt_params)
        appointment.status       ||= :pending
        appointment.payment_status ||= :pending

        if appointment.save
          if params[:enable_google_meet].to_s == 'true' || params[:appointment]&.dig(:enable_google_meet).to_s == 'true'
            result = Appointments::GenerateGoogleMeetLink.call(appointment: appointment)
            appointment.reload if result.success?
          end

          recurrence_pattern = params[:recurrence_pattern] || params[:appointment]&.dig(:recurrence_pattern)
          if recurrence_pattern.present?
            recurring_result = Appointments::CreateRecurring.call(
              parent_appointment: appointment,
              recurrence_pattern: recurrence_pattern
            )
            Rails.logger.error "Erro ao criar recorrência: #{recurring_result.error}" unless recurring_result.success?
          end

          begin
            payment_link = create_stripe_payment_link(appointment)
            appointment.update!(stripe_payment_link_id: payment_link.id, stripe_payment_intent_id: payment_link.payment_intent)
            render json: appointment_json(appointment, payment_link.url), status: :created
          rescue => e
            Rails.logger.error "appointments#create payment link: #{e.message}"
            render json: appointment_json(appointment), status: :created
          end
        else
          render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error "appointments#create: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def show
        render json: appointment_json(@appointment)
      end

      def update
        status_value = params[:status] || params[:appointment]&.dig(:status)
        if status_value.present?
          status_sym = status_value.to_sym
          @appointment.status = Appointment::APPOINTMENT_STATUS[status_sym] if Appointment::APPOINTMENT_STATUS.key?(status_sym)
        end

        payment_status_value = params[:payment_status] || params[:appointment]&.dig(:payment_status)
        if payment_status_value.present?
          payment_status_sym = payment_status_value.to_sym
          @appointment.payment_status = Appointment::PAYMENT_STATUS[payment_status_sym] if Appointment::PAYMENT_STATUS.key?(payment_status_sym)
        end

        if @appointment.update(appointment_params)
          render json: appointment_json(@appointment)
        else
          render json: { errors: @appointment.errors.full_messages }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error "appointments#update: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def destroy
        @appointment.cancel!
        render json: appointment_json(@appointment.reload)
      rescue => e
        Rails.logger.error "appointments#destroy: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def send_reminder
        result = Appointments::SendWhatsappReminder.call(appointment: @appointment)

        if result.success?
          render json: {
            success: true,
            message: 'Lembrete enviado com sucesso',
            whatsapp_link: result.whatsapp_link,
            reminder_sent_at: @appointment.reload.whatsapp_reminder_sent_at&.iso8601
          }
        else
          render json: { success: false, error: result.error }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error "appointments#send_reminder: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def generate_google_meet
        result = Appointments::GenerateGoogleMeetLink.call(appointment: @appointment)

        if result.success?
          render json: { success: true, google_meet_link: result.google_meet_link, appointment: appointment_json(@appointment.reload) }
        else
          render json: { success: false, error: result.error }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error "appointments#generate_google_meet: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def send_anamnese
        unless @appointment.anamnese_template_id.present?
          return render json: { success: false, error: 'Nenhum formulário de anamnese vinculado a este agendamento' }, status: :unprocessable_entity
        end

        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
        anamnese_url = "#{frontend_url}/anamnese/responder/#{@appointment.manage_token}"
        patient_name = @appointment.contact&.name || @appointment.whatsapp_number

        message = "📋 *Formulário de Anamnese*\n\n"
        message += "Olá#{patient_name.present? ? ", #{patient_name.split.first}" : ''}!\n\n"
        message += "Antes da sua consulta, por favor preencha o formulário abaixo:\n\n"
        message += "🔗 #{anamnese_url}\n\n"
        message += "Obrigado! 🌿"

        phone = @appointment.contact&.cell_phone_number || @appointment.whatsapp_number
        account = @appointment.account

        sent = false
        whatsapp_link = nil

        if phone.present? && WhatsApp::EvolutionApiClient.configured?(account: account)
          result = WhatsApp::EvolutionApiClient.send_message(account: account, phone: phone, message: message)
          sent = result[:success]
        end

        unless sent
          normalized = phone.to_s.gsub(/\D/, '')
          normalized = "55#{normalized}" unless normalized.start_with?('55')
          whatsapp_link = "https://wa.me/#{normalized}?text=#{ERB::Util.url_encode(message)}"
        end

        render json: {
          success: true,
          sent_via_api: sent,
          whatsapp_link: whatsapp_link,
          anamnese_url: anamnese_url,
          message: message
        }
      rescue => e
        Rails.logger.error "appointments#send_anamnese: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def professional_document_templates
        account = Current.account || @current_account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        templates = account.professional_document_templates.order(created_at: :desc)
        render json: {
          templates: templates.map do |t|
            { id: t.id, name: t.name, description: t.description,
              professional_type: t.professional_type,
              professional_type_label: t.professional_type_label,
              enable_sessions: t.enable_sessions }
          end
        }
      rescue => e
        Rails.logger.error "appointments#professional_document_templates: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      def generate_professional_document
        template = @appointment.account.professional_document_templates.find(params[:template_id])

        result = Documents::ProfessionalDocuments::ProfessionalDocumentGenerator.call(
          account: @appointment.account,
          user: Current.user,
          template: template,
          contact: @appointment.contact,
          appointment: @appointment,
          document_content: params[:document_content] || '',
          progress: params[:progress] || '',
          instructions: params[:instructions] || '',
          observations: params[:observations] || ''
        )

        unless result.content
          return render json: { success: false, error: 'Erro ao gerar documento' }, status: :unprocessable_entity
        end

        filename = "#{template.name.parameterize(separator: '_')}_#{Time.current.strftime('%Y%m%d_%H%M%S')}.html"
        @appointment.attachments.attach(io: StringIO.new(result.content), filename: filename, content_type: 'text/html')
        attached = @appointment.attachments.last

        render json: {
          success: true,
          content: result.content,
          template: { id: template.id, name: template.name, professional_type: template.professional_type },
          attachment: { id: attached.id, filename: attached.filename.to_s,
                        content_type: attached.content_type, byte_size: attached.byte_size,
                        created_at: attached.created_at.iso8601 }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { success: false, error: 'Template não encontrado' }, status: :not_found
      rescue => e
        Rails.logger.error "appointments#generate_professional_document: #{e.message}"
        render json: { success: false, error: e.message }, status: :internal_server_error
      end

      private

      def set_appointment
        account = Current.account || @current_account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        @appointment = account.appointments.find(params[:id])
      end

      def appointment_params
        permitted = [
          :account_user_id, :service_id, :contact_id,
          :start_time, :end_time, :whatsapp_number,
          :price_cents, :price_currency, :status, :payment_status,
          :google_meet_link, :enable_google_meet, :anamnese_template_id,
          additional_service_ids: [],
          recurrence_pattern: {}
        ]
        params[:appointment].present? ? params.require(:appointment).permit(*permitted) : params.permit(*permitted)
      end

      def authenticate_api_key
        api_key = request.headers['X-API-Key'] || params[:api_key]
        expected_key = Rails.application.credentials.dig(:n8n, :api_key)
        expected_key = 'dev_api_key_12345' if (Rails.env.development? || Rails.env.test?) && expected_key.nil?

        unless api_key && api_key == expected_key
          render json: { error: 'Invalid API key' }, status: :unauthorized
          return false
        end
        true
      end

      def set_account_from_api
        account_id = params[:account_id] || request.headers['X-Account-Id']
        return render json: { error: 'Account ID is required' }, status: :bad_request unless account_id

        @current_account = Account.find(account_id)
        Current.account = @current_account
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Account not found' }, status: :not_found
        false
      end

      def current_account
        @current_account || Current.account || super
      end

      def create_stripe_payment_link(appointment)
        account = current_account
        
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

        # Criar produto no Stripe se não existir
        product_name = "#{appointment.service.name} - #{appointment.start_time.strftime('%d/%m/%Y %H:%M')}"
        
        # Criar Payment Link
        payment_link = Stripe::PaymentLink.create(
          line_items: [{
            price_data: {
              currency: appointment.price_currency.downcase,
              product_data: {
                name: product_name,
                description: "Agendamento: #{appointment.service.name}"
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
              url: "#{ENV.fetch('DEFAULT_HOST_NAME', 'http://localhost:3000')}/appointments/success"
            }
          }
        )

        payment_link
      end

      def appointment_json(appointment, payment_link_url = nil)
        # Converter status numérico para string (chave do enum)
        status_key = Appointment::APPOINTMENT_STATUS.key(appointment.status)
        payment_status_key = Appointment::PAYMENT_STATUS.key(appointment.payment_status)
        
        {
          id: appointment.id,
          service: appointment.service ? service_json(appointment.service) : nil,
          additional_service_ids: appointment.additional_service_ids || [],
          additional_services: begin
            ids = (appointment.additional_service_ids || []).map(&:to_i).uniq
            ids.any? ? appointment.account.services.where(id: ids).map { |s| service_json(s) } : []
          end,
          professional: appointment.account_user ? professional_json(appointment.account_user) : nil,
          client: appointment.contact ? {
            id: appointment.contact.id,
            name: appointment.contact.name,
            whatsapp_number: appointment.contact.cell_phone_number
          } : {
            whatsapp_number: appointment.whatsapp_number
          },
          start_time: appointment.start_time&.iso8601,
          end_time: appointment.end_time&.iso8601,
          price: {
            cents: appointment.price_cents,
            currency: appointment.price_currency,
            formatted: Money.new(appointment.price_cents, appointment.price_currency).format
          },
          status: status_key ? status_key.to_s : appointment.status.to_s,
          payment_status: payment_status_key ? payment_status_key.to_s : appointment.payment_status.to_s,
          payment_link_url: payment_link_url || appointment.stripe_payment_link_id ? "https://buy.stripe.com/test_link" : nil,
          google_meet_link: appointment.google_meet_link,
          has_google_meet: appointment.has_google_meet?,
          recurring: appointment.recurring?,
          recurrence_pattern: appointment.recurrence_pattern,
          parent_appointment_id: appointment.parent_appointment_id,
          appointment_note: appointment.appointment_note ? {
            id: appointment.appointment_note.id,
            notes: appointment.appointment_note.notes,
            patient_tasks: appointment.appointment_note.patient_tasks || [],
            pending_tasks: appointment.appointment_note.pending_tasks,
            completed_tasks: appointment.appointment_note.completed_tasks
          } : nil,
          previous_session_pending_tasks: appointment.previous_session_pending_tasks,
          all_pending_tasks: appointment.all_pending_tasks_for_patient,
          whatsapp_reminder_sent: appointment.whatsapp_reminder_sent || false,
          whatsapp_reminder_sent_at: appointment.whatsapp_reminder_sent_at&.iso8601,
          appointment_link_id: appointment.appointment_link_id,
          booking_source: appointment.appointment_link_id.present? ? 'public_link' : 'manual',
          attachments: appointment.attachments.attached? ? appointment.attachments.map do |attachment|
            {
              id: attachment.id,
              filename: attachment.filename.to_s,
              content_type: attachment.content_type,
              byte_size: attachment.byte_size,
              created_at: attachment.created_at.iso8601
            }
          end : [],
          manage_token:         appointment.manage_token,
          anamnese_template_id: appointment.anamnese_template_id,
          anamnese_filled:      appointment.anamnese_response.present?,
          anamnese_filled_at:   appointment.anamnese_response&.filled_at&.iso8601,
          created_at: appointment.created_at.iso8601,
          updated_at: appointment.updated_at.iso8601
        }
      end

      def service_json(service)
        return nil unless service

        {
          id: service.id,
          name: service.name,
          description: service.description,
          modality: Service::MODALITIES.key(service.modality || 0)&.to_s || 'presencial',
          meeting_url: service.meeting_url,
          selling_price_cents: service.selling_price_cents || 0,
          currency: service.currency || 'BRL',
          price: {
            cents: service.selling_price_cents || 0,
            currency: service.currency || 'BRL',
            formatted: Money.new(service.selling_price_cents || 0, service.currency || 'BRL').format
          }
        }
      end

      def professional_json(account_user)
        return nil unless account_user
        
        user = account_user.user
        return nil unless user
        
        {
          id: account_user.id,
          user_id: user.id,
          name: "#{user.first_name} #{user.last_name}".strip,
          email: user.email,
          schedule: account_user.schedule
        }
      end

      def appointment_from_whatsapp(account, whatsapp_number)
        return nil unless whatsapp_number.present?
        
        # Normalizar número (remover caracteres não numéricos)
        normalized_number = whatsapp_number.gsub(/\D/, '')
        return nil if normalized_number.blank?
        
        # Buscar contato existente - buscar em memória para maior compatibilidade
        contact = nil
        account.contacts.find_each do |c|
          cell_normalized = (c.cell_phone_number || '').gsub(/\D/, '')
          phone_normalized = (c.phone_number || '').gsub(/\D/, '')
          if cell_normalized == normalized_number || phone_normalized == normalized_number
            contact = c
            break
          end
        end
        
        # Se ainda não encontrar, criar novo contato
        if contact.nil?
          contact = account.contacts.build(
            first_name: "Cliente #{whatsapp_number}",
            cell_phone_number: normalized_number,
            contact_type_cd: Contact::CONTACT_TYPES[:customer]
          )
          unless contact.save
            Rails.logger.error "Failed to create contact: #{contact.errors.full_messages.join(', ')}"
            return nil
          end
        end
        
        contact
      end
    end
  end
end

