# frozen_string_literal: true

module Lists
  class StackedItemComponent < ApplicationComponent
    renders_one :avatar
    renders_one :description
    renders_one :actions

    def initialize(options: {})
      @options = options
      super
    end
  end
end
