# frozen_string_literal: true

module Navigation
  class TabsBodyComponent < ApplicationComponent
    renders_many :panels, 'Navigation::TabContentComponent'

    def initialize(options: {})
      @options = options
      super
    end
  end
end
