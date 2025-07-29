# frozen_string_literal: true

module Navigation
  class TabsComponent < ApplicationComponent
    renders_one :header, 'Navigation::TabsHeaderComponent'
    renders_one :body, 'Navigation::TabsBodyComponent'

    def initialize(options: {})
      @options = options
      super
    end
  end
end
