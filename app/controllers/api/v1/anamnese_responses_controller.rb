# frozen_string_literal: true

module Api
  module V1
    class AnamneseResponsesController < ApplicationController
      before_action :set_appointment

      def show
        response = @appointment.anamnese_response
        if response
          render json: { response: response.as_json(include: :anamnese_template) }
        else
          render json: { response: nil }
        end
      end

      def create
        existing = @appointment.anamnese_response

        if existing
          if existing.update(response_params)
            render json: {
              response: existing.as_json(include: :anamnese_template),
              message: 'Anamnese atualizada com sucesso'
            }
          else
            render json: { errors: existing.errors.full_messages }, status: :unprocessable_entity
          end
        else
          anamnese = Current.account.anamnese_responses.build(
            response_params.merge(appointment: @appointment, contact_id: @appointment.contact_id)
          )

          if anamnese.save
            render json: {
              response: anamnese.as_json(include: :anamnese_template),
              message: 'Anamnese salva com sucesso'
            }, status: :created
          else
            render json: { errors: anamnese.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      private

      def set_appointment
        @appointment = Current.account.appointments.find(params[:appointment_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Agendamento não encontrado' }, status: :not_found
      end

      def response_params
        params.require(:anamnese_response).permit(:anamnese_template_id, responses: {})
      end
    end
  end
end
