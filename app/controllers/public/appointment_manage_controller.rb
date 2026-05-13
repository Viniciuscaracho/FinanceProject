# frozen_string_literal: true

module Public
  class AppointmentManageController < ApplicationController
    skip_before_action :authenticate_user!
    skip_before_action :set_request_details
    skip_forgery_protection

    before_action :find_appointment

    # GET /agendar/gerenciar/:manage_token
    def show
      render json: appointment_payload
    end

    # POST /agendar/gerenciar/:manage_token/cancel
    def cancel
      unless @appointment.can_be_managed?
        return render json: { success: false, error: window_closed_error }, status: :unprocessable_entity
      end

      unless @appointment.status.in?([:pending, :confirmed])
        return render json: { success: false, error: 'Este agendamento não pode ser cancelado.' }, status: :unprocessable_entity
      end

      @appointment.update!(status: :canceled)
      send_notification(:canceled)

      render json: { success: true, appointment: appointment_payload }
    end

    # POST /agendar/gerenciar/:manage_token/reschedule
    def reschedule
      unless @appointment.can_be_managed?
        return render json: { success: false, error: window_closed_error }, status: :unprocessable_entity
      end

      new_start = Time.zone.parse(params[:new_start_time].to_s)
      new_end   = Time.zone.parse(params[:new_end_time].to_s)

      if new_start.nil? || new_end.nil?
        return render json: { success: false, error: 'Horários inválidos.' }, status: :unprocessable_entity
      end

      if new_start <= Time.current
        return render json: { success: false, error: 'O novo horário deve ser no futuro.' }, status: :unprocessable_entity
      end

      if new_end <= new_start
        return render json: { success: false, error: 'O horário de término deve ser após o início.' }, status: :unprocessable_entity
      end

      @appointment.update!(start_time: new_start, end_time: new_end)
      send_notification(:rescheduled)

      render json: { success: true, appointment: appointment_payload }
    end

    private

    def find_appointment
      @appointment = Appointment.find_by(manage_token: params[:manage_token])
      render json: { error: 'Agendamento não encontrado.' }, status: :not_found unless @appointment
    end

    def appointment_payload
      link = @appointment.appointment_link
      hours = (link&.settings&.dig('cancel_reschedule_hours')&.to_i || 24).clamp(1, 720)

      {
        id:                    @appointment.id,
        status:                Appointment::APPOINTMENT_STATUS.key(@appointment.status)&.to_s,
        start_time:            @appointment.start_time&.iso8601,
        end_time:              @appointment.end_time&.iso8601,
        can_manage:            @appointment.can_be_managed?,
        manage_deadline:       @appointment.manage_window_deadline&.iso8601,
        cancel_reschedule_hours: hours,
        link_token:            link&.token,
        service: @appointment.service ? {
          id:   @appointment.service.id,
          name: @appointment.service.name,
        } : nil,
        professional: @appointment.account_user ? {
          id:   @appointment.account_user.id,
          name: "#{@appointment.account_user.user.first_name} #{@appointment.account_user.user.last_name}".strip,
        } : nil,
        company_name:    @appointment.account&.company&.name.presence ||
                         @appointment.account&.company&.first_name,
        google_meet_link: @appointment.google_meet_link,
      }
    end

    def window_closed_error
      hours = (@appointment.appointment_link&.settings&.dig('cancel_reschedule_hours')&.to_i || 24).clamp(1, 720)
      "O prazo para gerenciar este agendamento encerrou. Cancelamentos e reagendamentos devem ser feitos com pelo menos #{hours}h de antecedência."
    end

    def send_notification(event)
      return unless @appointment.whatsapp_number.present?

      account = @appointment.account
      message = build_notification_message(event)

      if WhatsApp::EvolutionApiClient.configured?(account: account)
        WhatsApp::EvolutionApiClient.send_message(account: account, phone: @appointment.whatsapp_number, message: message)
      end
    rescue => e
      Rails.logger.error "Erro ao enviar notificação de #{event}: #{e.message}"
    end

    def build_notification_message(event)
      service_name  = @appointment.service&.name
      start_time    = @appointment.start_time.in_time_zone('America/Sao_Paulo').strftime('%d/%m/%Y às %H:%M')
      company_name  = @appointment.account&.company&.name.presence ||
                      @appointment.account&.company&.first_name.presence || 'nossa equipe'

      case event
      when :canceled
        "❌ *Agendamento Cancelado*\n\n" \
        "Seu agendamento foi cancelado com sucesso:\n\n" \
        "📅 *Data:* #{start_time}\n" \
        "💼 *Serviço:* #{service_name}\n\n" \
        "Se precisar agendar novamente, entre em contato com #{company_name}."
      when :rescheduled
        new_time = @appointment.start_time.in_time_zone('America/Sao_Paulo').strftime('%d/%m/%Y às %H:%M')
        "🔄 *Agendamento Reagendado*\n\n" \
        "Seu agendamento foi reagendado com sucesso:\n\n" \
        "📅 *Nova data:* #{new_time}\n" \
        "💼 *Serviço:* #{service_name}\n\n" \
        "Qualquer dúvida, fale com #{company_name}."
      end
    end
  end
end
