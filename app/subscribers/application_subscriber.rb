# frozen_string_literal: true

# This class is a base class for all application subscribers. It provides a way to subscribe to events and handle them in a more organized way.
# To create a new subscriber, you should create a new class that inherits from this class and implement the `perform` method or
# a method with the same name as the event you want to subscribe to (e.g. `on_my_event` for the event `my_event`).
# You can use the `on_publish` class method to subscribe to events.
# The subscriber will automatically subscribe to the events when the class is loaded and unsubscribe when the class is unloaded
# Dot not use this class directly, create a subclass instead.
# Do not use instance variables in your subscriber, because it is a singleton class.
# Example:
# class MySubscriber < ApplicationSubscriber
#   on_publish 'my_event'
#
#   def perform(event)
#     puts "My event was triggered with payload: #{event.payload}"
#   end
# end
# OR
# class MySubscriber < ApplicationSubscriber
#   on_publish 'my_event'
#
#   def on_my_event(event)
#     puts "My event was triggered with payload: #{event.payload}"
#   end
# end
# MySubscriber.register
# # => My event was triggered with payload: data
class ApplicationSubscriber
  include Singleton
  include ActiveSupport::Notifications

  @events = []

  def self.on_publish(*event_names)
    @events = event_names
  end

  def self.reload
    descendants.each(&:unregister)
    descendants.each(&:register)
  end

  def self.register
    # Rails.logger.debug("--- Subscribing (#{name}) to [#{@events.join(', ')}] ---")
    @events.each do |event_name|
      ActiveSupport::Notifications.subscribe(event_name.to_s, instance)
    end
  end

  def self.unregister
    # Rails.logger.debug("--- Unsubscribing (#{name}) to [#{@events.join(', ')}] ---")
    @events.each do |event_name|
      ActiveSupport::Notifications.unsubscribe(event_name.to_s)
    end
  end

  def call(event_name, start, ending, transaction_id, payload)
    method_name = if respond_to?("on_#{event_name}")
                    "on_#{event_name}"
                  else
                    'perform'
                  end

    Rails.logger.debug("#{DateTime.current.iso8601} --- #{self.class.name}##{method_name} started ---")
    send(method_name, Event.new(event_name, start, ending, transaction_id, payload))
    Rails.logger.debug("#{DateTime.current.iso8601} --- #{self.class.name}##{method_name} done ---")
  end

  def perform(_event)
    raise NotImplementedError, 'Implement in your subclass'
  end
end
