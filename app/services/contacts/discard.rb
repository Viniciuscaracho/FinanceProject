# frozen_string_literal: true

module Contacts
  class Discard < ApplicationService
    def call
      context.contact.discard
      return dispatch_event if context.contact.discarded?

      add_fail_message(context.contact)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.contact, event: Contacts::ContactDiscarded)
    end
  end
end
