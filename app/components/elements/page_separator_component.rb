# frozen_string_literal: true

module Elements
  class PageSeparatorComponent < ApplicationComponent
    def initialize(text: nil, options: {})
      @text = text
      @options = options
      super
    end
  end
end
