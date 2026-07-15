# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class FileImportsController < ApplicationController
        before_action :set_contact

        def create
          file = params[:file]

          unless file.present?
            render json: { error: 'Arquivo obrigatório' }, status: :unprocessable_entity
            return
          end

          unless ::Coaching::ExtractFileService.supported?(file.content_type, file.original_filename)
            render json: { error: 'Formato não suportado. Use PDF, DOCX ou TXT.' }, status: :unprocessable_entity
            return
          end

          extracted = ::Coaching::ExtractFileService.new(file).call

          if extracted.blank?
            render json: { error: 'Não foi possível extrair texto do arquivo' }, status: :unprocessable_entity
            return
          end

          structured = ::Coaching::StructureNoteService.new(extracted).call

          event = TimelineEvent.new(
            account:      Current.account,
            contact:      @contact,
            account_user: current_account_user,
            raw_input:    extracted,
            source:       'import',
            sono:         structured[:sono],
            carga:        structured[:carga],
            observacao:   structured[:observacao],
            proxima_acao: structured[:proxima_acao]
          )

          if event.save
            render json: { event: event_json(event), filename: file.original_filename }, status: :created
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
