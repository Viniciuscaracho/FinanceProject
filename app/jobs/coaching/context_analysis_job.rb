# frozen_string_literal: true

module Coaching
  class ContextAnalysisJob < ApplicationJob
    queue_as :default

    DEBOUNCE_HOURS = 2

    def perform(account_id, contact_id, event_id)
      account = Account.find_by(id: account_id)
      contact = Contact.find_by(id: contact_id)
      event   = TimelineEvent.find_by(id: event_id)
      return unless account && contact && event

      recently_analyzed = CoachingInsight
        .where(account: account, contact: contact)
        .where(created_at: DEBOUNCE_HOURS.hours.ago..)
        .exists?
      return if recently_analyzed

      Coaching::ContextAnalysisService.new(account, contact, event).call
    end
  end
end
