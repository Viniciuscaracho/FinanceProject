# frozen_string_literal: true

module Navigation
  class TabsHeaderComponent < ApplicationComponent
    renders_many :items, 'Navigation::TabItemComponent'

    def initialize(options: {})
      @options = options
      super
    end
  end
end
