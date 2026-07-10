# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class AudioNotesController < ApplicationController
        before_action :set_contact

        def create
          unless params[:audio].present?
            render json: { error: 'Arquivo de áudio obrigatório' }, status: :unprocessable_entity
            return
          end

          transcript = ::Coaching::TranscribeAudioService.new(params[:audio]).call

          if transcript.blank?
            render json: { error: 'Não foi possível transcrever o áudio' }, status: :unprocessable_entity
            return
          end

          structured = ::Coaching::StructureNoteService.new(transcript).call

          event = TimelineEvent.new(
            account:      Current.account,
            contact:      @contact,
            account_user: current_account_user,
            raw_input:    transcript,
            source:       'whisper',
            sono:         structured[:sono],
            carga:        structured[:carga],
            observacao:   structured[:observacao],
            proxima_acao: structured[:proxima_acao]
          )

          if event.save
            render json: { event: event_json(event), transcript: transcript }, status: :created
          else
            render json: { errors: event.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_contact
          @contact = Current.account.contacts.find(params[:contact_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Atleta não encontrado' }, status: :not_found
        end

        def current_account_user
          AccountUser.find_by(account: Current.account, user: @current_user)
        end

        def event_json(event)
          {
            id:           event.id,
            raw_input:    event.raw_input,
            source:       event.source,
            sono:         event.sono,
            carga:        event.carga,
            observacao:   event.observacao,
            proxima_acao: event.proxima_acao,
            created_at:   event.created_at.iso8601
          }
        end
      end
    end
  end
end
