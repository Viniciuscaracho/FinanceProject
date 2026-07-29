# frozen_string_literal: true

module Coaching
  class ContextAnalysisJob < ApplicationJob
    queue_as :default

    # Padrões históricos não mudam em horas — 1x por dia por atleta é suficiente.
    # Reduz chamadas ao GPT-4o-mini em ~90% para treinadores ativos.
    DEBOUNCE_HOURS = 23

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
