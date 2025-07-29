# frozen_string_literal: true

module CostCenters
  class Discard < ApplicationService
    def call
      context.cost_center.discard
      return dispatch_event if context.cost_center.discarded?

      add_fail_message(context.cost_center)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.category, event: Categories::CategoryDiscarded)
    end
  end
end
