# frozen_string_literal: true

module Api
  module V1
    module Public
      class AnamneseController < ActionController::API
        def show
          appointment = find_appointment
          return render json: { error: 'Link inválido ou expirado' }, status: :not_found unless appointment

          template  = appointment.anamnese_template ||
                      appointment.account.anamnese_templates.active.order(created_at: :asc).first
          existing  = appointment.anamnese_response

          render json: {
            appointment: appointment_json(appointment),
            template:    template&.as_json,
            response:    existing&.as_json,
            filled:      existing.present?,
          }
        end

        def create
          appointment = find_appointment
          return render json: { error: 'Link inválido ou expirado' }, status: :not_found unless appointment

          template_id = params.dig(:anamnese_response, :anamnese_template_id) ||
                        appointment.anamnese_template_id ||
                        appointment.account.anamnese_templates.active.order(created_at: :asc).first&.id

          responses = params.dig(:anamnese_response, :responses)&.to_unsafe_h || {}

          existing = appointment.anamnese_response

          if existing
            existing.update!(responses: responses, anamnese_template_id: template_id)
            render json: { response: existing.as_json, message: 'Anamnese atualizada!' }
          else
            response = appointment.account.anamnese_responses.create!(
              appointment:         appointment,
              contact_id:          appointment.contact_id,
              anamnese_template_id: template_id,
              responses:           responses,
            )
            render json: { response: response.as_json, message: 'Anamnese enviada com sucesso!' }, status: :created
          end
        rescue ActiveRecord::RecordInvalid => e
          render_internal_error(e, status: :unprocessable_entity)
        end

        private

        def find_appointment
          Appointment.find_by(manage_token: params[:token])
        end

        def appointment_json(appt)
          user = appt.account_user&.user
          {
            id:           appt.id,
            start_time:   appt.start_time,
            service_name: appt.service&.name,
            professional: user ? "#{user.first_name} #{user.last_name}".strip : nil,
          }
        end
      end
    end
  end
end
