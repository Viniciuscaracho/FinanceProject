# frozen_string_literal: true

module DeviceDetector
  extend ActiveSupport::Concern

  included do
    helper Turbo::Native::Navigation
    helper_method :mobile_request?, :tablet_request?, :desktop_request?

    before_action :set_variant
  end

  def set_variant
    browser = Browser.new(request.user_agent)
    if browser.mobile?
      request.variant = :phone
    elsif browser.tablet?
      request.variant = :tablet
    end
  end

  def mobile_request?
    request.variant.any? { |v| v.to_sym == :phone }
  end

  def tablet_request?
    request.variant.any? { |v| v.to_sym == :tablet }
  end

  def desktop_request?
    !mobile_request? && !tablet_request?
  end
end
