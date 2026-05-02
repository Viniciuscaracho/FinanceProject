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
      before_action :set_appointment, only: [:show, :update, :destroy, :generate_professional_document]

      # GET /api/v1/appointments
      # Lista todos os agendamentos
      def index
        begin
          account = Current.account
          Rails.logger.info "=== Appointments#index ==="
          Rails.logger.info "Current.account: #{account&.id}"
          
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end
          
          appointments = account.appointments
                               .includes(:account_user, :service, :contact, :appointment_commissions, :appointment_note)
                               .order(start_time: :desc)

          # Filtros
          appointments = appointments.where(status: params[:status]) if params[:status].present?
          appointments = appointments.where(payment_status: params[:payment_status]) if params[:payment_status].present?
          appointments = appointments.where(account_user_id: params[:account_user_id]) if params[:account_user_id].present?
          
          # Filtro por data (para melhor performance)
          if params[:start_date].present? || params[:end_date].present?
            start_date = params[:start_date].present? ? Time.parse(params[:start_date]).beginning_of_day : nil
            end_date = params[:end_date].present? ? Time.parse(params[:end_date]).end_of_day : nil
            
            if start_date && end_date
              appointments = appointments.by_date_range(start_date, end_date)
            elsif start_date
              appointments = appointments.where('start_time >= ?', start_date)
            elsif end_date
              appointments = appointments.where('start_time <= ?', end_date)
            end
          end

          Rails.logger.info "Appointments found: #{appointments.count} (filters: start_date=#{params[:start_date]}, end_date=#{params[:end_date]})"
          render json: appointments.map { |apt| appointment_json(apt) }
        rescue => e
          Rails.logger.error "Error in appointments#index: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/appointments/services
      # Lista todos os serviços disponíveis
      def services
        begin
          account = Current.account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          services = account.services.provideds.where(enabled: 't').order(:name)
          render json: services.map { |s| service_json(s) }
        rescue => e
          Rails.logger.error "Error in appointments#services: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/appointments/professionals
      # Lista todos os profissionais disponíveis
      def professionals
        begin
          account = Current.account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end
          
          professionals = account.account_users.includes(:user).order('users.first_name')
          render json: professionals.map { |au| professional_json(au) }
        rescue => e
          Rails.logger.error "Error in appointments#professionals: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/appointments/available_slots
      # Retorna horários disponíveis para um profissional em uma data
      # Parâmetros: professional_id, date, service_id (opcional para calcular duração)
      def available_slots
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          professional_id = params[:professional_id]
          date = params[:date] ? Date.parse(params[:date]) : Date.today
          service_id = params[:service_id]

          professional = account.account_users.find_by(id: professional_id)
          unless professional
            render json: { error: 'Professional not found' }, status: :not_found
            return
          end
          
          service = service_id ? account.services.find_by(id: service_id) : nil

          # Obter horários de trabalho do profissional para o dia específico
          working_hours = professional.working_hours_for_date(date)
          
          unless working_hours
            # Profissional não trabalha neste dia
            render json: { available_slots: [] }
            return
          end

          start_hour = working_hours[:start_time].hour
          end_hour = working_hours[:end_time].hour
          slot_duration = service&.metadata&.dig('duration_minutes')&.to_i || 60

          # Gerar slots de 30 em 30 minutos dentro do horário de trabalho
          available_slots = []
          current_time = date.beginning_of_day + start_hour.hours

          while current_time < date.beginning_of_day + end_hour.hours
            slot_end = current_time + slot_duration.minutes
            break if slot_end > date.beginning_of_day + end_hour.hours

            # Verificar se há conflito com agendamentos existentes
            # Excluir agendamentos cancelados e não compareceu (no_show)
            conflicting = Appointment
                          .where(account_user_id: professional_id)
                          .where.not(status: [
                            Appointment::APPOINTMENT_STATUS[:canceled],
                            Appointment::APPOINTMENT_STATUS[:no_show]
                          ])
                          .where('(start_time < ? AND end_time > ?)', slot_end, current_time)
                          .exists?

            # Verificar se o slot está dentro do horário de trabalho do profissional
            slot_available = !conflicting && professional.available_at?(current_time) && 
                            professional.available_at?(slot_end - 1.minute)

            available_slots << {
              start_time: current_time.iso8601,
              end_time: slot_end.iso8601,
              available: slot_available
            } if slot_available

            current_time += 30.minutes
          end

          render json: { available_slots: available_slots }
        rescue => e
          Rails.logger.error "Error in appointments#available_slots: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # POST /api/v1/appointments
      # Cria um pré-agendamento (pode ser chamado via chatbot com API key)
      def create
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          appointment_params_data = appointment_params
          
          # Se não tiver contact_id mas tiver whatsapp_number, buscar ou criar contato
          if appointment_params_data[:contact_id].blank? && appointment_params_data[:whatsapp_number].present?
            contact = appointment_from_whatsapp(account, appointment_params_data[:whatsapp_number])
            appointment_params_data[:contact_id] = contact.id if contact
          end

          appointment = account.appointments.build(appointment_params_data)
          # O enum será definido automaticamente pelo default no schema, mas vamos garantir
          appointment.status ||= :pending
          appointment.payment_status ||= :pending

          if appointment.save
            # Gerar link do Google Meet se solicitado (após salvar para ter ID)
            if params[:enable_google_meet].to_s == 'true' || params[:appointment]&.dig(:enable_google_meet).to_s == 'true'
              result = Appointments::GenerateGoogleMeetLink.call(appointment: appointment)
              if result.success?
                appointment.reload
              end
            end
            # Criar agendamentos recorrentes se solicitado
            if params[:recurrence_pattern].present? || params[:appointment]&.dig(:recurrence_pattern).present?
              recurrence_pattern = params[:recurrence_pattern] || params[:appointment]&.dig(:recurrence_pattern)
              recurring_result = Appointments::CreateRecurring.call(
                parent_appointment: appointment,
                recurrence_pattern: recurrence_pattern
              )
              
              if recurring_result.success?
                Rails.logger.info "✅ Criados #{recurring_result.count} agendamentos recorrentes"
              else
                Rails.logger.error "❌ Erro ao criar agendamentos recorrentes: #{recurring_result.error}"
              end
            end

            # Gerar Payment Link do Stripe (se configurado)
            begin
              payment_link = create_stripe_payment_link(appointment)
              
              appointment.update!(
                stripe_payment_link_id: payment_link.id,
                stripe_payment_intent_id: payment_link.payment_intent
              )

              render json: appointment_json(appointment, payment_link.url), status: :created
            rescue => e
              Rails.logger.error "Erro ao criar payment link: #{e.message}"
              # Retornar agendamento mesmo sem payment link (para desenvolvimento)
              render json: appointment_json(appointment), status: :created
            end
          else
            render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in appointments#create: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/appointments/:id
      def show
        render json: appointment_json(@appointment)
      end

      # PATCH /api/v1/appointments/:id
      def update
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          update_params = appointment_params
          
          # Permitir atualização de status e payment_status diretamente
          # Pode vir de params[:status] ou params[:appointment][:status]
          status_value = params[:status] || params[:appointment]&.dig(:status)
          if status_value.present?
            status_sym = status_value.to_sym
            if Appointment::APPOINTMENT_STATUS.key?(status_sym)
              @appointment.status = Appointment::APPOINTMENT_STATUS[status_sym]
            end
          end
          
          payment_status_value = params[:payment_status] || params[:appointment]&.dig(:payment_status)
          if payment_status_value.present?
            payment_status_sym = payment_status_value.to_sym
            if Appointment::PAYMENT_STATUS.key?(payment_status_sym)
              @appointment.payment_status = Appointment::PAYMENT_STATUS[payment_status_sym]
            end
          end

          if @appointment.update(update_params)
            render json: appointment_json(@appointment)
          else
            render json: { errors: @appointment.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in appointments#update: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # DELETE /api/v1/appointments/:id
      def destroy
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          @appointment.destroy
          head :no_content
        rescue => e
          Rails.logger.error "Error in appointments#destroy: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # POST /api/v1/appointments/:id/send_reminder
      # Envia lembrete via WhatsApp para o agendamento
      def send_reminder
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
          
          if result.success?
            render json: {
              success: true,
              message: 'Lembrete enviado com sucesso',
              whatsapp_link: result.whatsapp_link,
              reminder_sent_at: @appointment.reload.whatsapp_reminder_sent_at&.iso8601
            }
          else
            render json: { 
              success: false,
              error: result.error 
            }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in appointments#send_reminder: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # POST /api/v1/appointments/:id/generate_google_meet
      # Gera um link do Google Meet para o agendamento
      def generate_google_meet
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          result = Appointments::GenerateGoogleMeetLink.call(appointment: @appointment)
          
          if result.success?
            render json: {
              success: true,
              google_meet_link: result.google_meet_link,
              appointment: appointment_json(@appointment.reload)
            }
          else
            render json: { 
              success: false,
              error: result.error 
            }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in appointments#generate_google_meet: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/appointments/:id/professional_document_templates
      # Lista templates de documentos profissionais disponíveis para o agendamento
      def professional_document_templates
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          templates = account.professional_document_templates.order(created_at: :desc)
          
          render json: {
            templates: templates.map do |template|
              {
                id: template.id,
                name: template.name,
                description: template.description,
                professional_type: template.professional_type,
                professional_type_label: template.professional_type_label,
                enable_sessions: template.enable_sessions
              }
            end
          }
        rescue => e
          Rails.logger.error "Error in appointments#professional_document_templates: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # POST /api/v1/appointments/:id/generate_professional_document
      # Gera um documento profissional a partir do agendamento
      def generate_professional_document
        begin
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end

          template_id = params[:template_id]
          document_content = params[:document_content] || ''
          progress = params[:progress] || ''
          instructions = params[:instructions] || ''
          observations = params[:observations] || ''

          template = account.professional_document_templates.find(template_id)
          contact = @appointment.contact
          user = Current.user

          # Gerar documento usando o serviço
          result = Documents::ProfessionalDocuments::ProfessionalDocumentGenerator.call(
            account: account,
            user: user,
            template: template,
            contact: contact,
            appointment: @appointment,
            document_content: document_content,
            progress: progress,
            instructions: instructions,
            observations: observations
          )

          if result.content
            timestamp = Time.current.strftime('%Y%m%d_%H%M%S')
            safe_name = template.name.parameterize(separator: '_')
            filename = "#{safe_name}_#{timestamp}.html"

            @appointment.attachments.attach(
              io: StringIO.new(result.content),
              filename: filename,
              content_type: 'text/html'
            )

            attached = @appointment.attachments.last

            render json: {
              success: true,
              content: result.content,
              template: {
                id: template.id,
                name: template.name,
                professional_type: template.professional_type
              },
              attachment: {
                id: attached.id,
                filename: attached.filename.to_s,
                content_type: attached.content_type,
                byte_size: attached.byte_size,
                created_at: attached.created_at.iso8601
              }
            }
          else
            render json: { 
              success: false,
              error: 'Erro ao gerar documento'
            }, status: :unprocessable_entity
          end
        rescue ActiveRecord::RecordNotFound => e
          render json: { 
            success: false,
            error: 'Template não encontrado'
          }, status: :not_found
        rescue => e
          Rails.logger.error "Error in appointments#generate_professional_document: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { 
            success: false,
            error: e.message 
          }, status: :internal_server_error
        end
      end

      private

      def set_appointment
        account = Current.account || @current_account
        unless account
          render json: { error: 'Account not found' }, status: :forbidden
          return
        end
        @appointment = account.appointments.find(params[:id])
      end

      def appointment_params
        # Permitir parâmetros diretos ou aninhados (para compatibilidade com chatbot)
        if params[:appointment].present?
          params.require(:appointment).permit(
            :account_user_id, :service_id, :contact_id,
            :start_time, :end_time, :whatsapp_number,
            :price_cents, :price_currency, :status, :payment_status,
            :google_meet_link, :enable_google_meet,
            recurrence_pattern: {}
          )
        else
          # Parâmetros diretos (para requisições do chatbot)
          params.permit(
            :account_user_id, :service_id, :contact_id,
            :start_time, :end_time, :whatsapp_number,
            :price_cents, :price_currency, :status, :payment_status,
            :google_meet_link, :enable_google_meet,
            recurrence_pattern: {}
          )
        end
      end

      def authenticate_api_key
        api_key = request.headers['X-API-Key'] || params[:api_key]
        expected_key = Rails.application.credentials.dig(:n8n, :api_key)
        
        # Em desenvolvimento, permitir API key padrão se não estiver configurada
        if Rails.env.development? && expected_key.nil?
          expected_key = 'dev_api_key_12345'
        end
        
        unless api_key && api_key == expected_key
          render json: { error: 'Invalid API key' }, status: :unauthorized
          return false
        end
        true
      end

      def set_account_from_api
        account_id = params[:account_id] || request.headers['X-Account-Id']
        
        unless account_id
          render json: { error: 'Account ID is required' }, status: :bad_request
          return false
        end

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
          attachments: appointment.attachments.attached? ? appointment.attachments.map do |attachment|
            {
              id: attachment.id,
              filename: attachment.filename.to_s,
              content_type: attachment.content_type,
              byte_size: attachment.byte_size,
              created_at: attachment.created_at.iso8601
            }
          end : [],
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
          email: user.email
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

