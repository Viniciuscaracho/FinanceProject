# frozen_string_literal: true

module Contacts
  class Create < ApplicationService
    def call
      context.contact = context.account.contacts.new(context.contact_params)
      return dispatch_event if context.contact.save

      add_fail_message(context.contact)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.contact, event: Contacts::ContactCreated)
    end
  end
end
