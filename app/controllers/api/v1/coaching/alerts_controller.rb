# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class AlertsController < ApplicationController
        def index
          alerts = ::Coaching::DetectorService.new(Current.account).call
          render json: { alerts: alerts }
        end
      end
    end
  end
end
