# frozen_string_literal: true

module CostCenters
  class Create < ApplicationService
    def call
      context.cost_center = context.account.cost_centers.new(context.cost_center_params)
      return dispatch_event if context.cost_center.save

      add_fail_message(context.cost_center)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.cost_center, event: CostCenters::CostCenterCreated)
    end
  end
end
