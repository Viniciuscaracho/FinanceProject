# frozen_string_literal: true

module Slider
  class SliderComponent < ApplicationComponent
    renders_many :steps

    def initialize(options: {})
      super
      @options = options
    end
  end
end
