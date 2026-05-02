# frozen_string_literal: true

module Api
  module V1
    class AppointmentNotesController < ApplicationController
      before_action :set_appointment
      before_action :set_appointment_note, only: [:show, :update, :destroy]

      # GET /api/v1/appointments/:appointment_id/notes
      def index
        @notes = Current.account.appointment_notes
                         .where(appointment_id: @appointment.id)
                         .recent

        render json: {
          notes: @notes.as_json(include: :appointment),
          appointment: @appointment.as_json
        }
      end

      # GET /api/v1/appointments/:appointment_id/notes/:id
      def show
        render json: {
          note: @appointment_note.as_json(include: :appointment)
        }
      end

      # POST /api/v1/appointments/:appointment_id/notes
      def create
        # Verificar se já existe uma anotação para este agendamento
        existing_note = Current.account.appointment_notes.find_by(appointment_id: @appointment.id)
        
        if existing_note
          # Se já existe, atualizar em vez de criar nova
          if existing_note.update(appointment_note_params)
            render json: {
              note: appointment_note_json(existing_note).merge(appointment: existing_note.appointment.as_json),
              message: 'Anotação atualizada com sucesso'
            }
          else
            render json: {
              errors: existing_note.errors.full_messages
            }, status: :unprocessable_entity
          end
        else
          # Criar nova anotação
          @appointment_note = Current.account.appointment_notes.build(
            appointment_note_params.merge(appointment: @appointment)
          )

          if @appointment_note.save
            render json: {
              note: appointment_note_json(@appointment_note).merge(appointment: @appointment_note.appointment.as_json),
              message: 'Anotação criada com sucesso'
            }, status: :created
          else
            render json: {
              errors: @appointment_note.errors.full_messages
            }, status: :unprocessable_entity
          end
        end
      end

      # PATCH/PUT /api/v1/appointments/:appointment_id/notes/:id
      def update
        if @appointment_note.update(appointment_note_params)
          render json: {
            note: appointment_note_json(@appointment_note).merge(appointment: @appointment_note.appointment.as_json),
            message: 'Anotação atualizada com sucesso'
          }
        else
          render json: {
            errors: @appointment_note.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/appointments/:appointment_id/notes/:id
      def destroy
        @appointment_note.destroy
        render json: {
          message: 'Anotação removida com sucesso'
        }
      end

      # POST /api/v1/appointments/:appointment_id/notes/:id/add_task
      def add_task
        description = params[:task][:description]
        if @appointment_note.add_patient_task(description)
          render json: {
            note: appointment_note_json(@appointment_note),
            message: 'Tarefa adicionada com sucesso'
          }
        else
          render json: {
            errors: @appointment_note.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/appointments/:appointment_id/notes/:id/complete_task
      def complete_task
        task_id = params[:task_id]
        if @appointment_note.complete_task(task_id)
          render json: {
            note: appointment_note_json(@appointment_note),
            message: 'Tarefa marcada como concluída'
          }
        else
          render json: {
            error: 'Tarefa não encontrada'
          }, status: :not_found
        end
      end

      # DELETE /api/v1/appointments/:appointment_id/notes/:id/remove_task/:task_id
      def remove_task
        task_id = params[:task_id]
        if @appointment_note.remove_task(task_id)
          render json: {
            note: appointment_note_json(@appointment_note),
            message: 'Tarefa removida com sucesso'
          }
        else
          render json: {
            error: 'Erro ao remover tarefa'
          }, status: :unprocessable_entity
        end
      end

      private

      def set_appointment
        @appointment = Current.account.appointments.find(params[:appointment_id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: 'Agendamento não encontrado'
        }, status: :not_found
      end

      def set_appointment_note
        @appointment_note = Current.account.appointment_notes.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: 'Anotação não encontrada'
        }, status: :not_found
      end

      def appointment_note_params
        params.require(:appointment_note).permit(:notes, patient_tasks: [])
      end

      def appointment_note_json(note)
        note.as_json
      end
    end
  end
end

