# frozen_string_literal: true

module Api
  module V1
    class AppointmentNotesController < ApplicationController
      before_action :set_appointment
      before_action :set_appointment_note, only: [:show, :update, :destroy]

      def index
        @notes = Current.account.appointment_notes
                        .where(appointment_id: @appointment.id)
                        .recent

        render json: {
          notes:       @notes.as_json(include: :appointment),
          appointment: @appointment.as_json
        }
      end

      def show
        render json: { note: @appointment_note.as_json(include: :appointment) }
      end

      def create
        existing_note = Current.account.appointment_notes.find_by(appointment_id: @appointment.id)

        if existing_note
          if existing_note.update(appointment_note_params)
            render json: {
              note:    appointment_note_json(existing_note).merge(appointment: existing_note.appointment.as_json),
              message: 'Anotação atualizada com sucesso'
            }
          else
            render json: { errors: existing_note.errors.full_messages }, status: :unprocessable_entity
          end
        else
          @appointment_note = Current.account.appointment_notes.build(
            appointment_note_params.merge(appointment: @appointment)
          )

          if @appointment_note.save
            render json: {
              note:    appointment_note_json(@appointment_note).merge(appointment: @appointment_note.appointment.as_json),
              message: 'Anotação criada com sucesso'
            }, status: :created
          else
            render json: { errors: @appointment_note.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      def update
        if @appointment_note.update(appointment_note_params)
          render json: {
            note:    appointment_note_json(@appointment_note).merge(appointment: @appointment_note.appointment.as_json),
            message: 'Anotação atualizada com sucesso'
          }
        else
          render json: { errors: @appointment_note.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @appointment_note.destroy
        render json: { message: 'Anotação removida com sucesso' }
      end

      def add_task
        if @appointment_note.add_patient_task(params[:task][:description])
          render json: { note: appointment_note_json(@appointment_note), message: 'Tarefa adicionada com sucesso' }
        else
          render json: { errors: @appointment_note.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def complete_task
        if @appointment_note.complete_task(params[:task_id])
          render json: { note: appointment_note_json(@appointment_note), message: 'Tarefa marcada como concluída' }
        else
          render json: { error: 'Tarefa não encontrada' }, status: :not_found
        end
      end

      def remove_task
        if @appointment_note.remove_task(params[:task_id])
          render json: { note: appointment_note_json(@appointment_note), message: 'Tarefa removida com sucesso' }
        else
          render json: { error: 'Erro ao remover tarefa' }, status: :unprocessable_entity
        end
      end

      private

      def set_appointment
        @appointment = Current.account.appointments.find(params[:appointment_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Agendamento não encontrado' }, status: :not_found
      end

      def set_appointment_note
        @appointment_note = Current.account.appointment_notes.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Anotação não encontrada' }, status: :not_found
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
