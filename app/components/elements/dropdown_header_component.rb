# frozen_string_literal: true

module Elements
  class DropdownHeaderComponent < ApplicationComponent
    def initialize(text:, options: {})
      @text = text
      @options = {}
      super
    end
  end
end
