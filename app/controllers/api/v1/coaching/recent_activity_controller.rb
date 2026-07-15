# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class RecentActivityController < ApplicationController
        def index
          hours = [params[:hours].to_i.nonzero? || 24, 72].min
          since = hours.hours.ago

          events = TimelineEvent
            .where(account: Current.account, created_at: since..)
            .includes(:contact)
            .order(created_at: :desc)
            .limit(30)

          render json: {
            events: events.filter_map { |e| serialize(e) },
            since:  since.iso8601,
          }
        end

        private

        def serialize(event)
          return nil unless event.contact

          {
            id:           event.id,
            contact_id:   event.contact_id,
            contact_name: event.contact.name,
            source:       event.source,
            summary:      event.observacao.presence || event.raw_input.to_s.truncate(120),
            carga:        event.carga,
            sono:         event.sono,
            proxima_acao: event.proxima_acao,
            created_at:   event.created_at.iso8601,
          }
        end
      end
    end
  end
end
