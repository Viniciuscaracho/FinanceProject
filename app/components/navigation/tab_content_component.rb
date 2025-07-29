# frozen_string_literal: true

module Navigation
  class TabContentComponent < ApplicationComponent
    def initialize(options: {})
      @options = options
      super
    end
  end
end
