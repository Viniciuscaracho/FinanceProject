# frozen_string_literal: true

module RailsEventStoreHelper

  # Publishes an event to the event store
  def publish(event_name, payload = {})
    event_store.instrument(event_name.to_s, payload)
  end

  # Publishes an event to the event store asynchronously using ActiveJob
  def publish_async(event_name, payload = {})
    InstrumentEventJob.perform_later(event_name.to_s, payload)
  end

  def event_store
    ActiveSupport::Notifications
  end
end
