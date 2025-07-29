# frozen_string_literal: true

module Navigation
  class BreadcrumbComponent < ApplicationComponent
    renders_many :items, Navigation::BreadcrumbItemComponent

    def initialize(options: {})
      @options = options
      super
    end
  end
end
