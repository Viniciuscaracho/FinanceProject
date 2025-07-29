# frozen_string_literal: true

module Contacts
  class Update < ApplicationService
    def call
      return dispatch_event if context.contact.update(context.contact_params)

      add_fail_message(context.contact)
    end

    private

    def dispatch_event
      # publish 'contact_updated', contact: context.contact
    end
  end
end
