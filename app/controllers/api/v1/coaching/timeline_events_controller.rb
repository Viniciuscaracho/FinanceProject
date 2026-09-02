# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class TimelineEventsController < ApplicationController
        before_action :set_contact

        def index
          events = TimelineEvent
            .for_contact(@contact.id)
            .where(account: Current.account)
            .recent
            .limit(50)

          events = events.search(params[:q]) if params[:q].present?

          render json: { events: events.map { |e| event_json(e) } }
        end

        def create
          structured = ::Coaching::StructureNoteService.new(params[:raw_input]).call

          event = TimelineEvent.new(
            account:        Current.account,
            contact:        @contact,
            account_user:   current_account_user,
            raw_input:      params[:raw_input],
            source:         params[:source].presence_in(%w[manual session_note whisper whatsapp_manual import]) || 'manual',
            sono:           structured[:sono],
            carga:          structured[:carga],
            observacao:     structured[:observacao],
            proxima_acao:   structured[:proxima_acao],
            extras:         build_extras(structured)
          )

          if event.save
            render json: { event: event_json(event) }, status: :created
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

        def build_extras(parsed)
          h = {
            modalidade:     parsed[:modalidade],
            divisao_treino: parsed[:divisao_treino],
            exercicios:     parsed[:exercicios],
            volume:         parsed[:volume],
            metodo:         parsed[:metodo]
          }.compact
          h.empty? ? nil : h
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
            extras:       event.extras,
            created_at:   event.created_at.iso8601
          }
        end
      end
    end
  end
end
