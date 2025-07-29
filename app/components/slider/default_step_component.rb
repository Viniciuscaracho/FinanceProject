# frozen_string_literal: true

module Slider
  class DefaultStepComponent < ApplicationComponent
    def initialize(title:, image:, description:, options: {})
      super
      @title = title
      @image = image
      @description = description
      @options = options
    end
  end
end
