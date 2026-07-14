# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class DashboardController < ApplicationController
        def index
          render json: {
            alerts:          alerts,
            active_contacts: active_contacts,
            total_events:    total_events
          }
        end

        private

        def alerts
          ::Coaching::DetectorService.new(Current.account).call
        end

        def active_contacts
          rows = TimelineEvent
            .where(account: Current.account)
            .joins("INNER JOIN people ON people.id = timeline_events.contact_id AND people.type = 'Contact'")
            .group(:contact_id)
            .select('contact_id, COUNT(*) AS events_count, MAX(timeline_events.created_at) AS last_event_at')
            .order('last_event_at DESC')
            .limit(20)

          contact_ids = rows.map(&:contact_id)
          contacts_map = Contact.where(id: contact_ids).index_by(&:id)

          # Últimos 6 eventos por atleta em uma única query
          recent_events_map = TimelineEvent
            .where(account: Current.account, contact_id: contact_ids)
            .order(contact_id: :asc, created_at: :desc)
            .select(:contact_id, :carga, :sono, :created_at)
            .each_with_object({}) do |e, h|
              h[e.contact_id] ||= []
              h[e.contact_id] << e if h[e.contact_id].size < 6
            end

          rows.map do |row|
            contact = contacts_map[row.contact_id]
            next unless contact

            recent = recent_events_map[row.contact_id] || []

            {
              contact_id:    row.contact_id,
              contact_name:  contact.name,
              events_count:  row.events_count,
              last_event_at: row.last_event_at&.iso8601,
              recent_carga:  recent.map(&:carga).compact,
              recent_sono:   recent.map(&:sono).compact,
              last_carga:    recent.first&.carga,
              last_sono:     recent.first&.sono,
            }
          end.compact
        end

        def total_events
          TimelineEvent.where(account: Current.account).count
        end
      end
    end
  end
end
