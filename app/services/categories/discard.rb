# frozen_string_literal: true

module Categories
  class Discard < ApplicationService
    def call
      context.category.discard
      return dispatch_event if context.category.discarded?

      add_fail_message(context.category)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.category, event: Categories::CategoryDiscarded)
    end
  end
end
