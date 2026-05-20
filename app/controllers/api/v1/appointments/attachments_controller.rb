# frozen_string_literal: true

module Api
  module V1
    module Appointments
      class AttachmentsController < ApplicationController
        before_action :set_appointment

        # GET /api/v1/appointments/:appointment_id/attachments
        def index
          attachments = @appointment.attachments.map do |attachment|
            {
              id: attachment.id,
              filename: attachment.filename.to_s,
              content_type: attachment.content_type,
              byte_size: attachment.byte_size,
              created_at: attachment.created_at.iso8601,
              url: rails_blob_url(attachment, only_path: false)
            }
          end

          render json: { attachments: attachments }
        end

        # POST /api/v1/appointments/:appointment_id/attachments
        def create
          # Aceitar attachments como array ou como múltiplos parâmetros
          # Rails recebe attachments[] como array automaticamente
          files = params[:attachments] || params[:'attachments[]']
          
          if files.present?
            # Se for um array, usar diretamente; se não, criar array
            files_array = files.is_a?(Array) ? files : [files]
            @appointment.attachments.attach(files_array)
            @appointment.reload

            attachments = @appointment.attachments.map do |attachment|
              {
                id: attachment.id,
                filename: attachment.filename.to_s,
                content_type: attachment.content_type,
                byte_size: attachment.byte_size,
                created_at: attachment.created_at.iso8601,
                url: rails_blob_url(attachment, only_path: false)
              }
            end

            render json: {
              message: 'Anexos adicionados com sucesso',
              attachments: attachments
            }, status: :created
          else
            render json: { error: 'Nenhum arquivo fornecido' }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error attaching files: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render_internal_error(e)
        end

        # DELETE /api/v1/appointments/:appointment_id/attachments/:id
        def destroy
          attachment = @appointment.attachments.find(params[:id])
          attachment.purge_later
          @appointment.reload

          render json: { message: 'Anexo removido com sucesso' }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Anexo não encontrado' }, status: :not_found
        rescue => e
          Rails.logger.error "Error removing attachment: #{e.message}"
          render_internal_error(e)
        end

        private

        def set_appointment
          account = Current.account || @current_account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end
          @appointment = account.appointments.find(params[:appointment_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Agendamento não encontrado' }, status: :not_found
        end

        def rails_blob_url(attachment, only_path: false)
          helpers = Rails.application.routes.url_helpers
          if only_path
            helpers.rails_blob_path(attachment, only_path: true)
          else
            helpers.rails_blob_url(attachment)
          end
        rescue => e
          Rails.logger.error "Error generating blob URL: #{e.message}"
          nil
        end
      end
    end
  end
end

