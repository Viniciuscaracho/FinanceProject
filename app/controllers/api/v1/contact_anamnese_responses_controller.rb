# frozen_string_literal: true

module Api
  module V1
    # Cria e lista anamneses vinculadas diretamente ao paciente (sem agendamento)
    class ContactAnamneseResponsesController < ApplicationController
      before_action :set_contact

      def index
        responses = AnamneseResponse
          .where(contact_id: @contact.id, account: Current.account)
          .includes(:anamnese_template)
          .order(created_at: :desc)
          .limit(50)
        render json: { responses: responses.map { |r| response_json(r) } }
      end

      def create
        resp = AnamneseResponse.new(
          account:              Current.account,
          contact:              @contact,
          appointment_id:       nil,
          anamnese_template_id: params[:anamnese_template_id].presence,
          responses:            params[:responses] || {}
        )

        if resp.save
          render json: { response: response_json(resp) }, status: :created
        else
          render json: { errors: resp.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:contact_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Paciente não encontrado' }, status: :not_found
      end

      def response_json(resp)
        {
          id:                   resp.id,
          anamnese_template_id: resp.anamnese_template_id,
          anamnese_template:    resp.anamnese_template ? {
            id:     resp.anamnese_template.id,
            name:   resp.anamnese_template.name,
            fields: resp.anamnese_template.fields
          } : nil,
          responses:            resp.responses,
          filled_at:            resp.filled_at&.iso8601,
          created_at:           resp.created_at.iso8601,
          appointment_id:       resp.appointment_id,
          appointment_start_time: resp.appointment&.start_time&.iso8601
        }
      end
    end
  end
end
