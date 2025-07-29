# frozen_string_literal: true

module Charts
  class LineComponent < ApplicationComponent
    def initialize(data:, options: {})
      @data = data
      @options = options
      super
    end
  end
end
