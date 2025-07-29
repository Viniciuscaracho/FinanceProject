# frozen_string_literal: true

module Lists
  class StackedComponent < ApplicationComponent
    renders_many :items, Lists::StackedItemComponent

    def initialize(options: {})
      @options = options
      super
    end
  end
end
