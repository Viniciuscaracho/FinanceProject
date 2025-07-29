# frozen_string_literal: true

module Navigation
  class TabItemComponent < ApplicationComponent
    def initialize(description:, options: {})
      @description = description
      @options = options
      super
    end
  end
end
