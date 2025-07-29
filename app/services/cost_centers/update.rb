# frozen_string_literal: true

module CostCenters
  class Update < ApplicationService
    def call
      return dispatch_event if context.cost_center.update(context.cost_center_params)

      add_fail_message(context.cost_center)
    end

    private

    def dispatch_event
      # publish 'cost_center_updated', cost_center: context.cost_center
    end
  end
end
