# frozen_string_literal: true

module Elements
  class BadgeComponent < ApplicationComponent
    def initialize(text:, variant: :primary, options: {})
      @text = text
      @variant = variant
      @options = options
      super
    end

    def badge_class
      case @variant.to_sym
      when :success
        'badge badge--success'
      when :primary
        'badge badge--primary'
      when :warning
        'badge badge--warning'
      when :danger
        'badge badge--danger'
      else
        'badge badge--gray'
      end
    end
  end
end
