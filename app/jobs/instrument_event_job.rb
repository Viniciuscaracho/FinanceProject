# frozen_string_literal: true

class InstrumentEventJob < ApplicationJob
  queue_as :default

  def perform(event_name, payload)
    event_store.instrument(event_name, payload)
  end

  private

  def event_store
    ActiveSupport::Notifications
  end
end
