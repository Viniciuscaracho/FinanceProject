# frozen_string_literal: true

module Api
  module V1
    class PatientNotesController < ApplicationController
      before_action :set_contact
      before_action :set_note, only: %i[update destroy]

      def index
        notes = PatientNote.for_contact(@contact.id).recent.limit(100)
        render json: { notes: notes.map { |n| note_json(n) } }
      end

      def create
        note = PatientNote.new(
          account:   Current.account,
          contact:   @contact,
          content:   params[:content]
        )
        if note.save
          render json: { note: note_json(note) }, status: :created
        else
          render json: { errors: note.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @note.update(content: params[:content])
          render json: { note: note_json(@note) }
        else
          render json: { errors: @note.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @note.destroy
        render json: { message: 'Anotação removida' }
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:contact_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Paciente não encontrado' }, status: :not_found
      end

      def set_note
        @note = PatientNote.for_contact(@contact.id).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Anotação não encontrada' }, status: :not_found
      end

      def note_json(note)
        {
          id:         note.id,
          content:    note.content,
          created_at: note.created_at.iso8601,
          updated_at: note.updated_at.iso8601
        }
      end
    end
  end
end
