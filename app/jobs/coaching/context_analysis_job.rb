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

      # Cooldown baseado em quando a análise RODOU — não em quando gerou insight.
      # CoachingInsight-based check falha para atletas cujo histórico não gera
      # padrões: cada evento dispararia uma chamada ao GPT mesmo sem retorno.
      cooldown_key = "coaching_analysis_cooldown:#{account_id}:#{contact_id}"
      return if Rails.cache.exist?(cooldown_key)

      Rails.cache.write(cooldown_key, true, expires_in: DEBOUNCE_HOURS.hours)

      Coaching::ContextAnalysisService.new(account, contact, event).call
    end
  end
end
