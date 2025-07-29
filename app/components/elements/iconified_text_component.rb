# frozen_string_literal: true

module Elements
  class IconifiedTextComponent < ApplicationComponent
    def initialize(icon:, text:, options: {})
      @icon = icon
      @text = text
      @options = options
      super
    end
  end
end
