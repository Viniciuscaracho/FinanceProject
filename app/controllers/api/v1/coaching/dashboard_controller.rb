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
          TimelineEvent
            .where(account: Current.account)
            .joins("INNER JOIN people ON people.id = timeline_events.contact_id AND people.type = 'Contact'")
            .group(:contact_id)
            .select('contact_id, COUNT(*) AS events_count, MAX(timeline_events.created_at) AS last_event_at')
            .order('last_event_at DESC')
            .limit(20)
            .map do |row|
              contact = Contact.find_by(id: row.contact_id)
              next unless contact

              {
                contact_id:    row.contact_id,
                contact_name:  contact.name,
                events_count:  row.events_count,
                last_event_at: row.last_event_at&.iso8601
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
